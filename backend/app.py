from flask import Flask, request, jsonify, g
from flask_cors import CORS

from auth import require_auth                          
from routes.upload_item import upload_item_handler
from db.get_closet_by_user import get_closet_by_user
from db.store_quiz_result import store_quiz_result
from db.init_db import get_or_create_user_id           

app = Flask(__name__)
CORS(app, supports_credentials=True)              


@app.route("/upload_item", methods=["POST"])
@require_auth
def upload_item():
    firebase_uid = g.current_user["uid"]
    user_id = get_or_create_user_id(firebase_uid)      
    return upload_item_handler(request, user_id)


@app.route("/get_closet_by_user", methods=["GET"])
@require_auth
def get_closet_route():
    firebase_uid = g.current_user["uid"]
    user_id = get_or_create_user_id(firebase_uid)
    closet = get_closet_by_user(user_id)
    return jsonify(closet)


@app.route("/submit_quiz", methods=["POST"])
@require_auth
def submit_quiz():
    firebase_uid = g.current_user["uid"]
    user_id = get_or_create_user_id(firebase_uid)

    data = request.get_json()
    style = data.get("style")
    store_quiz_result(user_id, style)

    return {"message": "Quiz results saved successfully"}

# ───────────────────────────────────────────────────────────────── #

if __name__ == "__main__":
    app.run(debug=True, port=5000)
