from services.remove_bg import remove_background
from services.firebase_upload import upload_to_firebase
from db.insert_clothing_item import save_item_to_db 
from services.gemini import gemini_tag_image

def upload_item_handler(request, user_id, firebase_uid):
    image_file = request.files.get('image')

    cleaned_image = remove_background(image_file)     

    image_url = upload_to_firebase(cleaned_image, firebase_uid)

    tags = gemini_tag_image(image_url)

    item_id = save_item_to_db(user_id, image_url, tags)

    return {"message": "Item added successfully", "item_id": item_id}
