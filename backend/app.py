from flask import Flask, request, jsonify, g
from flask_cors import CORS
from auth import require_auth
from routes.upload_item import upload_item_handler
import io, requests, json
from PIL import Image
import datetime
Resample = getattr(Image, "Resampling", Image)
LANCZOS  = getattr(Resample, "LANCZOS", Image.LANCZOS)
from services.firebase_upload import upload_to_firebase
from db.store_quiz_result import store_quiz_result
from db.init_db import (
    init_db, DB_NAME, get_or_create_user_id,sql_query,
    create_post, toggle_like, toggle_follow, get_feed, get_following,
    add_clothes_to_post, clothes_for_post, search_users,
    recent_searches
)
from db.get_closet_by_user import get_closet_by_user, get_user_style
from db.store_quiz_result   import store_quiz_result
from services.gemini import generate_ootd

init_db()

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": [
        "http://localhost:3000",  
        "http://127.0.0.1:3000",   
    ]}},
    supports_credentials=True,          
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)
# Closet & Quiz 
@app.route("/upload_item", methods=["POST"])
@require_auth
def upload_item():
    firebase_uid = g.current_user["uid"]
    user_id      = get_or_create_user_id(firebase_uid)
    return upload_item_handler(request, user_id, firebase_uid)


@app.route("/get_closet_by_user", methods=["GET"])
@require_auth
def get_closet_route():
    firebase_uid = g.current_user["uid"]
    user_id      = get_or_create_user_id(firebase_uid)
    closet       = get_closet_by_user(user_id)
    return jsonify(closet)



@app.route("/submit_quiz", methods=["POST"])
@require_auth
def submit_quiz():
    firebase_uid = g.current_user["uid"]
    user_id = get_or_create_user_id(firebase_uid)

    username = request.form.get("username")
    age      = int(request.form.get("age", 0))
    gender   = request.form.get("gender")
    bio      = request.form.get("bio")
    picks    = json.loads(request.form.get("picks", "[]")) 

    style_labels = picks  

    avatar_file = request.files.get("avatar")
    if avatar_file:
        img_bytes   = avatar_file.read()                 
        avatar_url  = upload_to_firebase(img_bytes, firebase_uid)  
    else:
        avatar_url = ""

    store_quiz_result(
        user_id=user_id,
        username=username,
        avatar_url=avatar_url,
        bio=bio,
        age=age,
        gender=gender,
        style_labels=style_labels,
    )

    return {"message": "Quiz results saved successfully"}

@app.get("/check_username")
@require_auth
def check_username():
    username = request.args.get("username", "").strip()
    if not username:
        return jsonify(available=False)

    row = sql_query(
        "SELECT 1 FROM users WHERE username = ?",
        (username,),
        fetch=True
    )
    return jsonify(available=len(row) == 0)


@app.post("/posts")
@require_auth
def api_create_post():
    uid   = g.current_user["uid"]
    file  = request.files["image"]
    caption = request.form.get("caption", "")
    clothes_ids = request.form.get("clothes")   
    clothes_ids = json.loads(clothes_ids) if clothes_ids else []

    img_bytes  = file.read()
    image_url  = upload_to_firebase(img_bytes, uid)

    author_id = get_or_create_user_id(uid)
    post_id   = create_post(author_id, image_url, caption)
    add_clothes_to_post(post_id, clothes_ids)

    return {"post_id": post_id}, 201


@app.post("/posts/<int:post_id>/like")
@require_auth
def api_like(post_id):
    uid      = g.current_user["uid"]
    user_id  = get_or_create_user_id(uid)
    toggle_like(user_id, post_id)
    return {}, 204

@app.post("/users/<int:target_id>/follow")
@require_auth
def api_follow(target_id):
    follower_id = get_or_create_user_id(g.current_user["uid"])
    toggle_follow(follower_id, target_id)
    return {}, 204



@app.get("/feed")
@require_auth
def api_feed():
    uid     = g.current_user["uid"]
    user_id = get_or_create_user_id(uid)
    page    = int(request.args.get("page", 0))
    limit   = 20
    posts   = get_feed(user_id, limit=limit, offset=page * limit)
    return {"posts": posts}

@app.get("/users/<string:uid>/following")
@require_auth
def api_get_following(uid):
    firebase_uid = g.current_user["uid"]
    user_id = get_or_create_user_id(firebase_uid)
    following = get_following(user_id)

    return {"following": following}


@app.get("/search")
@require_auth
def api_search_users():
    q = request.args.get("q", "").strip()
    uid = g.current_user["uid"]
    user_id = get_or_create_user_id(uid)

    if not q:
        rows = recent_searches(user_id)
    else:
        rows = search_users(q, user_id)

    results = []
    for r in rows:
        d = dict(r)
        results.append(d)

    return {"results": results}

@app.get("/posts/liked")
@require_auth
def api_liked_posts():
    firebase_uid = g.current_user["uid"]
    user_id = get_or_create_user_id(firebase_uid)

    rows = sql_query("""
        SELECT
            p.*,
            u.username,
            u.avatar_url,
            1 AS likedByMe
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id IN (
            SELECT post_id
            FROM likes
            WHERE user_id = ?
        )
        ORDER BY p.created_at DESC
    """, (user_id,), fetch=True)

    posts = []
    for r in rows:
        post = dict(r)
        post["clothes"] = clothes_for_post(post["id"])
        posts.append(post)

    return {"posts": posts}

@app.get("/public_profile/<int:user_id>")
def public_profile(user_id):
    row = sql_query(
        "SELECT username, avatar_url, bio FROM users WHERE id = ?",
        (user_id,), fetch=True
    )
    return jsonify(dict(row[0])) if row else (jsonify(error="404"), 404)

@app.get("/public_posts/<int:user_id>")
def public_posts(user_id):
    rows = sql_query(
        "SELECT id, image_url, caption FROM posts WHERE author_id = ? ORDER BY id DESC",
        (user_id,), fetch=True
    )
    return jsonify([dict(r) for r in rows])


# ───────────────────────────── Avatar ───────────────────────────── #
@app.post("/avatar")
@require_auth
def api_save_avatar():
    data = request.get_json(force=True)

    # Basic validation
    try:
        face      = int(data["face"])
        body_type = str(data["bodyType"])
    except (KeyError, ValueError):
        return {"error": "Invalid payload"}, 400

    firebase_uid = g.current_user["uid"]
    user_id      = get_or_create_user_id(firebase_uid)

    # Persist as JSON string
    avatar_json = json.dumps({"face": face, "bodyType": body_type})
    sql_query(
        "UPDATE users SET avatar_model = ? WHERE id = ?",
        (avatar_json, user_id)
    )

    return {}, 204



@app.get("/avatar")
@require_auth
def api_get_avatar():
    firebase_uid = g.current_user["uid"]
    user_id      = get_or_create_user_id(firebase_uid)

    row = sql_query(
        "SELECT avatar_model FROM users WHERE id = ?",
        (user_id,),
        fetch=True
    )
    model = row[0]["avatar_model"] if row else None
    return {"avatar": json.loads(model) if model else None}

# ───────────────────────────── Looks ───────────────────────────── #
@app.post("/looks")
@require_auth
def save_look():
    data  = request.get_json(force=True) or {}
    name = (data.get("name") or "Untitled Look").strip()
    avatar_url = data.get("avatar")
    stickers = data.get("stickers", [])
    canvas = data.get("canvas", {})
    cw, ch = int(canvas.get("w", 480)), int(canvas.get("h", 480))

    if not avatar_url:
        return jsonify(error="avatar field required"), 400

    base = Image.new("RGBA", (cw, ch), (255, 255, 255, 0))

    avatar_img = Image.open(io.BytesIO(requests.get(avatar_url).content)).convert("RGBA")
    av_w       = int(cw * 0.45)
    av_h       = int(avatar_img.height * av_w / avatar_img.width)
    avatar_img = avatar_img.resize((av_w, av_h), LANCZOS)
    av_x       = (cw - av_w) // 2
    av_y       = (ch - av_h) // 2
    base.paste(avatar_img, (av_x, av_y), avatar_img)

    for st in sorted(stickers, key=lambda s: s["z"]):
        img = Image.open(io.BytesIO(requests.get(st["src"]).content)).convert("RGBA")
        img = img.resize((int(st["w"]), int(st["h"])), LANCZOS)
        base.paste(img, (int(st["x"]), int(st["y"])), img)

    buf = io.BytesIO()
    base.save(buf, format="PNG")
    buf.seek(0)

    firebase_uid = g.current_user["uid"]
    image_url    = upload_to_firebase(buf.getvalue(), firebase_uid)

    user_id = get_or_create_user_id(firebase_uid)
    sql_query(
        "INSERT INTO looks (user_id, name, image_url, layout_json) VALUES (?,?,?,?)",
        (user_id, name, image_url, json.dumps(stickers))
    )
    return {}, 204

@app.get("/looks")
@require_auth
def list_looks():
    uid     = g.current_user["uid"]
    user_id = get_or_create_user_id(uid)

    rows = sql_query(
        "SELECT id, name, image_url, created_at FROM looks WHERE user_id = ? ORDER BY id DESC",
        (user_id,), fetch=True
    )
    return jsonify([dict(r) for r in rows])
# ─────────────────────────────────────────────────────────────────── #


@app.post("/generate_ootd")
@require_auth
def generate_outfit_of_the_day():
    firebase_uid = g.current_user["uid"]
    user_id      = get_or_create_user_id(firebase_uid)
    closet       = get_closet_by_user(user_id)
    if not closet:
        return jsonify(error="You have no items in your closet!"), 400

    style_words_db  = get_user_style(user_id)             
    style_words     = style_words_db or {}   
    
    outfit_ids = generate_ootd(style_words, closet)


    return jsonify({
        "style":  style_words,
        "outfit": outfit_ids
    }), 200


@app.post("/save_ootd")
@require_auth
def save_ootd():
    data = request.get_json(force=True) or {}
    item_ids = data.get("outfit", [])
    if not isinstance(item_ids, list) or not all(isinstance(i, int) for i in item_ids):
        return jsonify(error="outfit must be a list of ints"), 400

    firebase_uid = g.current_user["uid"]
    user_id      = get_or_create_user_id(firebase_uid)

    today = datetime.date.today().isoformat()  # 'YYYY‑MM‑DD'

    sql_query(
        """
        INSERT INTO ootd (user_id, date, item_ids)
        VALUES (?,?,?)
        ON CONFLICT(user_id, date) DO UPDATE
        SET item_ids = excluded.item_ids
        """,
        (user_id, today, json.dumps(item_ids)),
    )
    return {}, 204      

@app.get("/ootd_ids")
@require_auth
def fetch_ootd_ids():
    firebase_uid = g.current_user["uid"]
    user_id      = get_or_create_user_id(firebase_uid)
    today        = datetime.date.today().isoformat()

    row = sql_query(
        "SELECT item_ids FROM ootd WHERE user_id = ? AND date = ?",
        (user_id, today),
        fetch=True,
    )
    if not row:
        return jsonify(error="No OOTD saved today"), 404

    return jsonify({
        "date":   today,
        "outfit": json.loads(row[0]["item_ids"]),
    }), 200


@app.get("/fetch_profile")
@require_auth
def fetch_profile():
    uid     = g.current_user["uid"]
    user_id = get_or_create_user_id(uid)

    row = sql_query(
        """
        SELECT username AS displayName,
               avatar_url AS photoURL,
               bio, style, age, gender
        FROM   users
        WHERE  id = ?
        """,
        (user_id,),
        fetch=True,
    )

    profile = dict(row[0]) if row else {}
    return jsonify(profile), 200


@app.get("/fetch_posts")
@require_auth
def fetch_posts():
    uid     = g.current_user["uid"]
    user_id = get_or_create_user_id(uid)

    rows = sql_query(
        "SELECT id, image_url, caption "
        "FROM posts WHERE author_id = ? ORDER BY id DESC",
        (user_id,),
        fetch=True,
    )

    posts = [dict(r) for r in rows]        
    return jsonify(posts), 200


@app.post("/update_preferences")
@require_auth
def update_preferences():
    data = request.get_json(force=True) or {}
    firebase_uid = g.current_user["uid"]
    user_id      = get_or_create_user_id(firebase_uid)

    sql_query(
        """
        UPDATE users
        SET username    = COALESCE(NULLIF(?,''), username),
            age         = COALESCE(NULLIF(?,''), age),
            gender      = COALESCE(NULLIF(?,''), gender),
            bio         = COALESCE(NULLIF(?,''), bio),
            style      = COALESCE(NULLIF(?,''), style)
        WHERE id = ?
        """,
        (
            data.get("displayName"),
            data.get("age"),
            data.get("gender"),
            data.get("bio"),
            data.get("style"),
            user_id,
        ),
    )
    return {}, 204



if __name__ == "__main__":
    app.run(debug=True, port=5000)
