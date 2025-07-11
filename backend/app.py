from flask import Flask, request, jsonify
from routes.upload_item import upload_item_handler
from db.get_closet_by_user import get_closet_by_user
from db.store_quiz_result import store_quiz_result
from flask_cors import CORS


app = Flask(__name__)
CORS(app)
def get_user_id_from_token(request):
    return 'sam123'

    
@app.route('/upload_item', methods=['POST'])
def upload_item():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return {"error": "Unauthorized"}, 401
    
    return upload_item_handler(request, user_id)


@app.route('/get_closet_by_user', methods=['GET'])
def get_closet_route():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return {"error": "Unauthorized"}, 401

    closet = get_closet_by_user(user_id)
    return jsonify(closet)

@app.route('/submit_quiz', methods=['POST'])
# @require_auth

def submit_quiz():
    user_id = get_user_id_from_token(request)
    if not user_id:
        return {"error": "Unauthorized"}, 401

    data = request.get_json()
    style = data.get("style")

    store_quiz_result(user_id, style)
    return {"message": "Quiz results saved successfully"}


if __name__ == '__main__':
    app.run(debug=True)
