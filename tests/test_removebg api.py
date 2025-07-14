from backend.services.remove_bg import remove_background

def save_output(content, output_path):
    with open(output_path, 'wb') as f:
        f.write(content)

if __name__ == "__main__":
    input_image = "api_integration/Lion.jpg"
    output_image = "bg_removed.png"

    try:
        result = remove_background(input_image)
        save_output(result, output_image)
        print(" Background removed successfully. Check:", output_image)
    except Exception as e:
        print(" Failed to remove background:", e)