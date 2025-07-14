import uuid
from firebase_admin import storage

bucket = storage.bucket() 

def upload_to_firebase(img_bytes: bytes, firebase_uid: str) -> str:
    

    ext = "png"
    blob_name = f"closets/{firebase_uid}/{uuid.uuid4()}.{ext}"
    blob = bucket.blob(blob_name)

    blob.upload_from_string(img_bytes, content_type="image/png")
    blob.make_public()

    return blob.public_url
