from flask import Flask, request
from routes.upload_item import upload_item_handler

app = Flask(__name__)

@app.route('/upload_item', methods=['POST'])
def upload_item():
    return upload_item_handler(request)

if __name__ == '__main__':
    app.run(debug=True)
