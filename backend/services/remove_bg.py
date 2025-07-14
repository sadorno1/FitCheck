import requests, os
from dotenv import load_dotenv
load_dotenv()

REMOVE_BG_API_KEY = os.getenv("REMOVE_BG_API_KEY")

def remove_background(file_storage):
    files = {
        "image_file": (
            file_storage.filename,
            file_storage.stream,      
            file_storage.mimetype
        )
    }

    response = requests.post(
        "https://api.remove.bg/v1.0/removebg",
        files=files,
        data={"size": "auto"},
        headers={"X-Api-Key": REMOVE_BG_API_KEY}
    )

    if response.status_code == 200:
        return response.content            
    else:
        raise RuntimeError(
            f"remove.bg error {response.status_code}: {response.text}"
        )
