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
    add_clothes_to_post
)
from db.get_closet_by_user import get_closet_by_user
from db.store_quiz_result   import store_quiz_result

init_db()          
rows = sql_query("SELECT * FROM users", fetch=True)
print([dict(row) for row in rows])

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


@app.post("/users/<string:target_uid>/follow")
@require_auth
def api_follow(target_uid):
    follower_uid = g.current_user["uid"]
    follower_id  = get_or_create_user_id(follower_uid)
    followed_id  = get_or_create_user_id(target_uid)
    toggle_follow(follower_id, followed_id)
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
    if uid != "me" and uid != current_uid:
        return {"error": "Unauthorized"}, 403

    target_uid = current_uid if uid == "me" else uid
    user_id = get_or_create_user_id(target_uid)
    following = get_following(user_id)
    return {"following": following}

# ─────────────────────────────────────────────────────────────────── #
if __name__ == "__main__":
    app.run(debug=True, port=5000)
