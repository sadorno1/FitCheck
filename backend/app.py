from flask import Flask, request, jsonify, g
from flask_cors import CORS

from auth import require_auth
from routes.upload_item import upload_item_handler, upload_to_storage

# DB helpers
from db.init_db import (
    init_db, DB_NAME, get_or_create_user_id,
    create_post, toggle_like, toggle_follow, get_feed
)
from db.get_closet_by_user import get_closet_by_user
from db.store_quiz_result   import store_quiz_result

init_db()          # ensure tables exist

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
    user_id      = get_or_create_user_id(firebase_uid)

    data  = request.get_json()
    style = data.get("style")
    store_quiz_result(user_id, style)

    return {"message": "Quiz results saved successfully"}

# ─────────────────────────── Social Feed ─────────────────────────── #
@app.post("/posts")
@require_auth
def api_create_post():
    uid      = g.current_user["uid"]
    file     = request.files["image"]                    # multipart form field
    caption  = request.form.get("caption", "")

    # 1. upload to storage → public URL
    image_url = upload_to_storage(uid, file)

    # 2. DB write
    author_id = get_or_create_user_id(uid)
    post_id   = create_post(author_id, image_url, caption)
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

# ─────────────────────────────────────────────────────────────────── #
if __name__ == "__main__":
    app.run(debug=True, port=5000)
