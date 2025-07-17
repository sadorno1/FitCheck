import unittest
from unittest.mock import patch, MagicMock
from io import BytesIO

from routes.upload_item import upload_item_handler

class TestUploadItemHandler(unittest.TestCase):
    @patch("routes.upload_item.save_item_to_db")
    @patch("routes.upload_item.gemini_tag_image")
    @patch("routes.upload_item.upload_to_firebase")
    @patch("routes.upload_item.remove_background")
    def test_upload_item_handler_success(
        self, mock_remove_bg, mock_upload, mock_tag_image, mock_save_item
    ):
        # Setup dummy data
        mock_file = BytesIO(b"fake image bytes")
        mock_file.filename = "shirt.png"

        mock_request = MagicMock()
        mock_request.files.get.return_value = mock_file

        # Mock the services
        mock_remove_bg.return_value = b"cleaned_image_bytes"
        mock_upload.return_value = "https://fake-url.com/image.png"
        mock_tag_image.return_value = ["streetwear", "red", "cotton"]
        mock_save_item.return_value = 42  # fake item ID

        # Run the handler
        response = upload_item_handler(mock_request, user_id=1, firebase_uid="abc123")

        # Assertions
        self.assertEqual(response["message"], "Item added successfully")
        self.assertEqual(response["item_id"], 42)

        # Verify calls
        mock_remove_bg.assert_called_once_with(mock_file)
        mock_upload.assert_called_once_with(b"cleaned_image_bytes", "abc123")
        mock_tag_image.assert_called_once_with("https://fake-url.com/image.png")
        mock_save_item.assert_called_once_with(1, "https://fake-url.com/image.png", ["streetwear", "red", "cotton"])

if __name__ == "__main__":
    unittest.main()
