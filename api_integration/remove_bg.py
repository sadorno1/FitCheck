import requests

REMOVE_BG_API_KEY = 'xCkPjLS7tZLDPn6vgBztHDco'

def remove_background(image):
    with open(image, 'rb') as img_file:
        response = requests.post(
            'https://api.remove.bg/v1.0/removebg',
            files={'image_file': img_file},
            data={'size': 'auto'},
            headers={'X-Api-Key': REMOVE_BG_API_KEY},
        )
        if response.status_code == 200:
            return response.content 
        else:
            print("Error:", response.status_code, response.text)

    