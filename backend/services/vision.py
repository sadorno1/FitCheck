
from google.cloud import vision
from collections import Counter
from dotenv import load_dotenv
import os
load_dotenv()
print("Using credentials from:", os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
client = vision.ImageAnnotatorClient()
def analyze_image_labels(image_path):
    with open(image_path, 'rb') as image_file:
        content = image_file.read()
    image = vision.Image(content=content)
    response = client.label_detection(image=image)
    labels = response.label_annotations
    top_labels = [label.description.lower() for label in labels[:10]]
    return top_labels
def map_labels_to_tags(labels):
    type_map = {'shirt': 'top', 'jeans': 'bottom', 'jacket': 'outerwear', 'dress': 'dress'}
    etiquette_map = {'pajamas': 'pajama', 'tuxedo': 'formal', 'sweatshirt': 'casual', 'blazer': 'professional'}
    color_keywords = ['red', 'blue', 'white', 'black', 'green', 'yellow', 'beige', 'pink', 'brown', 'gray']
    type = next((type_map[label] for label in labels if label in type_map), 'unknown')
    etiquette = next((etiquette_map[label] for label in labels if label in etiquette_map), 'casual')
    color = next((label for label in labels if label in color_keywords), 'unknown')
    gemini_prompt = f"The outfit includes: {', '.join(labels)}. Describe its vibe in 1 sentence."
    return {
        'type': type,
        'etiquette': etiquette,
        'color': color,
        'gemini_prompt': gemini_prompt
    }

def get_tags_from_image(image_path):
    labels = analyze_image_labels(image_path)
    return map_labels_to_tags(labels)
