import os
import functools
from flask import request, jsonify, g
import firebase_admin
from firebase_admin import credentials, auth as fb_auth

cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not cred_path:
    raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS env var is not set")

if not firebase_admin._apps:
    firebase_admin.initialize_app(credentials.Certificate(cred_path))

def require_auth(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify(error="Missing or malformed auth header"), 401

        id_token = auth_header.split(" ", 1)[1]
        try:
            decoded = fb_auth.verify_id_token(id_token)
            g.current_user = decoded   
        except Exception as exc:
            return jsonify(error="Invalid or expired token", detail=str(exc)), 401

        return fn(*args, **kwargs)
    return wrapper
