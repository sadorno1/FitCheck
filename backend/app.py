from flask import Flask, request, jsonify
from firebase_admin import credentials, auth, initialize_app
from routes.upload_item import upload_item_handler
from db.get_closet_by_user import get_closet_by_user

cred = credentials.Certificate("serviceAccountKey.json")  
initialize_app(cred)

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(debug=True)
