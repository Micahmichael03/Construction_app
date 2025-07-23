import pytest
from fastapi.testclient import TestClient 
from main import app
import io
from PIL import Image
import numpy as np

client = TestClient(app)

def create_test_image():
    """Create a test image for testing"""
    # Create a simple test image
    img_array = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    img = Image.fromarray(img_array)
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    return img_bytes

def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "status" in data
    assert data["status"] == "healthy"

def test_health_endpoint():
    """Test the health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "timestamp" in data
    assert "model_loaded" in data
    assert "version" in data

def test_detect_endpoint_no_auth():
    """Test detection endpoint without authentication"""
    test_image = create_test_image()
    files = {"file": ("test.jpg", test_image, "image/jpeg")}
    
    response = client.post("/detect", files=files)
    assert response.status_code == 401  # Should require authentication

def test_qa_endpoint_no_auth():
    """Test Q&A endpoint without authentication"""
    test_image = create_test_image()
    files = {"file": ("test.jpg", test_image, "image/jpeg")}
    data = {"question": "What do you see in this image?"}
    
    response = client.post("/qa", files=files, data=data)
    assert response.status_code == 401  # Should require authentication

def test_items_endpoint_no_auth():
    """Test items endpoint without authentication"""
    response = client.get("/items")
    assert response.status_code == 401  # Should require authentication

def test_invalid_file_type():
    """Test with invalid file type"""
    # Create a text file instead of image
    files = {"file": ("test.txt", b"not an image", "text/plain")}
    
    response = client.post("/detect", files=files)
    assert response.status_code == 401  # Should require authentication first

def test_missing_question():
    """Test Q&A endpoint without question"""
    test_image = create_test_image()
    files = {"file": ("test.jpg", test_image, "image/jpeg")}
    
    response = client.post("/qa", files=files)
    assert response.status_code == 401  # Should require authentication first

if __name__ == "__main__":
    pytest.main([__file__]) 