import os
from backend.services.vision import analyze_image_labels
def test_image():
    image_path = os.path.join(os.path.dirname(__file__), "shirt.jpg")
    labels = analyze_image_labels(image_path)
    print("Detected labels:")
    for label in labels:
        print(f"- {label}")
if __name__ == "__main__":
    test_image()