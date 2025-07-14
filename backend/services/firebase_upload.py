import uuid
from firebase_admin import storage

def upload_to_firebase(file_obj, firebase_uid: str) -> str:
    ext = (file_obj.filename.rsplit(".", 1)[-1]).lower()
    filename = f"{uuid.uuid4().hex}.{ext}"

    bucket = storage.bucket()                     

    blob_path = f"users/{firebase_uid}/{filename}"
    blob = bucket.blob(blob_path)

    blob.upload_from_file(file_obj, content_type=file_obj.content_type)

    blob.make_public()

    return blob.public_url
