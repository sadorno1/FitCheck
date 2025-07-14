from services.remove_bg import remove_background
from services.firebase_upload import upload_to_firebase
from services.vision import get_tags_from_image
from db.insert_clothing_item import save_item_to_db 

def upload_item_handler(request, user_id, firebase_uid):
    image = request.files.get('image')
    cleaned_image = remove_background(image)
    image_url = upload_to_firebase(cleaned_image, firebase_uid)

    tags = get_tags_from_image(cleaned_image)

    item_id = save_item_to_db(user_id, image_url, tags)

    return {"message": "Item added successfully", "item_id": item_id}
