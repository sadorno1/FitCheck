
from google.cloud import vision
from collections import Counter
from dotenv import load_dotenv
import os
load_dotenv()
client = vision.ImageAnnotatorClient()

def analyze_image_labels(img_bytes):
    image = vision.Image(content=img_bytes)
    response = client.label_detection(image=image)
    labels = [label.description.lower() for label in response.label_annotations[:10]]
    return labels

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
