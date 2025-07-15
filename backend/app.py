from flask import Flask, request, jsonify, g
from flask_cors import CORS
from auth import require_auth
from routes.upload_item import upload_item_handler
import json
from services.firebase_upload import upload_to_firebase
from db.store_quiz_result import store_quiz_result
from db.init_db import (
    init_db, DB_NAME, get_or_create_user_id,sql_query,
    create_post, toggle_like, toggle_follow, get_feed, get_following,
    add_clothes_to_post, clothes_for_post, search_users,
    recent_searches, top_users  
)
from db.get_closet_by_user import get_closet_by_user
from db.store_quiz_result   import store_quiz_result

init_db()
# Replace post_id_value with the ID of the post you care about
all_users = sql_query(
    "SELECT * FROM users",
    fetch=True
)

# Print each as a dict
for user_row in all_users:
    print(dict(user_row))

app = Flask(__name__)
CORS(app, supports_credentials=True)

# ────────────────────────── Closet & Quiz ────────────────────────── #
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


# ─────────────────────────── Social Feed ─────────────────────────── #
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
    # current user’s numeric ID
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
    current_uid = g.current_user["uid"]
    if uid not in ("me", current_uid):
        return {"error": "Unauthorized"}, 403

    target_uid = current_uid if uid == "me" else uid
    app.logger.debug(f"Requested follow list for Firebase UID {target_uid}")

    user_id = get_or_create_user_id(target_uid)
    app.logger.debug(f"Mapped to local user_id {user_id}")

    following = get_following(user_id)
    app.logger.debug(f"get_following returned {following!r}")

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


# ─────────────────────────────────────────────────────────────────── #
if __name__ == "__main__":
    app.run(debug=True, port=5000)
