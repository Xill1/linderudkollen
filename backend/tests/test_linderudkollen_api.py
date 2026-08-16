"""
Backend API Tests for Linderudkollen Sportsstue
Tests: Auth, Gallery, Contact, Opening Hours endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@linderudkollen.no"
ADMIN_PASSWORD = "Linderud2026!"


class TestHealthAndRoot:
    """Health check and root endpoint tests"""
    
    def test_api_root(self):
        """Test API root endpoint returns expected message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Linderudkollen" in data["message"]
        print(f"✓ API root returns: {data['message']}")


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Token missing from response"
        assert "id" in data, "User ID missing from response"
        assert "email" in data, "Email missing from response"
        assert data["email"] == ADMIN_EMAIL
        assert data.get("role") == "admin"
        print(f"✓ Admin login successful: {data['email']}, role: {data.get('role')}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid login rejected: {data['detail']}")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("✓ Non-existent user login rejected")
    
    def test_auth_me_with_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login to get token
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Test /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data.get("role") == "admin"
        assert "password_hash" not in data  # Password should not be exposed
        print(f"✓ Auth/me returns user: {data['email']}")
    
    def test_auth_me_without_token(self):
        """Test /auth/me endpoint without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth/me without token rejected")
    
    def test_logout(self):
        """Test logout endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Logout successful: {data['message']}")


class TestGallery:
    """Gallery endpoint tests"""
    
    def test_get_gallery_public(self):
        """Test public gallery endpoint"""
        response = requests.get(f"{BASE_URL}/api/gallery")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Gallery returns {len(data)} images")
        
        # Verify image structure if images exist
        if len(data) > 0:
            img = data[0]
            assert "id" in img
            assert "title" in img
            assert "storage_path" in img
            print(f"  First image: {img['title']}")
    
    def test_get_gallery_image(self):
        """Test serving gallery image"""
        # First get gallery list
        gallery_resp = requests.get(f"{BASE_URL}/api/gallery")
        images = gallery_resp.json()
        
        if len(images) > 0:
            img_id = images[0]["id"]
            response = requests.get(f"{BASE_URL}/api/gallery/image/{img_id}")
            assert response.status_code == 200
            assert "image" in response.headers.get("Content-Type", "")
            print(f"✓ Gallery image served: {img_id}")
        else:
            pytest.skip("No images in gallery to test")
    
    def test_gallery_upload_requires_auth(self):
        """Test gallery upload requires authentication"""
        response = requests.post(f"{BASE_URL}/api/gallery/upload")
        assert response.status_code in [401, 422]  # 401 unauthorized or 422 missing file
        print("✓ Gallery upload requires auth")
    
    def test_gallery_delete_requires_auth(self):
        """Test gallery delete requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/gallery/test-id")
        assert response.status_code == 401
        print("✓ Gallery delete requires auth")


class TestContact:
    """Contact form endpoint tests"""
    
    def test_submit_contact_message(self):
        """Test submitting a contact message"""
        test_id = str(uuid.uuid4())[:8]
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": f"TEST_User_{test_id}",
            "email": f"test_{test_id}@example.com",
            "message": f"Test message from automated testing {test_id}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Contact message submitted: {data['message']}")
    
    def test_submit_contact_missing_fields(self):
        """Test contact submission with missing fields"""
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "Test"
            # Missing email and message
        })
        assert response.status_code == 422  # Validation error
        print("✓ Contact validation works for missing fields")
    
    def test_get_messages_requires_auth(self):
        """Test getting messages requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/contact/messages")
        assert response.status_code == 401
        print("✓ Contact messages require auth")
    
    def test_get_messages_as_admin(self):
        """Test admin can get contact messages"""
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Get messages
        response = requests.get(f"{BASE_URL}/api/contact/messages", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin can view {len(data)} contact messages")
        
        # Verify message structure if messages exist
        if len(data) > 0:
            msg = data[0]
            assert "id" in msg
            assert "name" in msg
            assert "email" in msg
            assert "message" in msg
            assert "is_read" in msg
            print(f"  Latest message from: {msg['name']}")


class TestOpeningHours:
    """Opening hours endpoint tests"""
    
    def test_get_opening_hours_public(self):
        """Test public opening hours endpoint"""
        response = requests.get(f"{BASE_URL}/api/opening-hours")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "period" in data
        assert "schedule" in data
        assert "notices" in data
        assert "footer_note" in data
        assert isinstance(data["schedule"], list)
        assert len(data["schedule"]) == 7  # 7 days of week
        
        print(f"✓ Opening hours: {data['period']}")
        print(f"  Schedule has {len(data['schedule'])} days")
        
        # Verify schedule structure
        for day in data["schedule"]:
            assert "day" in day
            assert "hours" in day
    
    def test_update_opening_hours_requires_auth(self):
        """Test updating opening hours requires admin auth"""
        response = requests.put(f"{BASE_URL}/api/opening-hours", json={
            "period": "Test",
            "schedule": [],
            "notices": [],
            "footer_note": "Test"
        })
        assert response.status_code == 401
        print("✓ Opening hours update requires auth")
    
    def test_update_opening_hours_as_admin(self):
        """Test admin can update opening hours"""
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Get current hours
        current = requests.get(f"{BASE_URL}/api/opening-hours").json()
        
        # Update with same data (to not break anything)
        response = requests.put(f"{BASE_URL}/api/opening-hours", 
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "period": current["period"],
                "schedule": current["schedule"],
                "notices": current["notices"],
                "footer_note": current["footer_note"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Admin can update opening hours: {data['message']}")
        
        # Verify update persisted
        verify = requests.get(f"{BASE_URL}/api/opening-hours").json()
        assert verify["period"] == current["period"]
        print("✓ Opening hours update persisted")


class TestAdminGalleryOperations:
    """Admin gallery operations tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return login_resp.json()["token"]
    
    def test_gallery_upload_as_admin(self, admin_token):
        """Test admin can upload gallery image"""
        # Create a simple test image (1x1 pixel PNG)
        import base64
        # Minimal valid PNG
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('test_image.png', png_data, 'image/png')
        }
        data = {
            'title': 'TEST_AutomatedTestImage',
            'description': 'Uploaded by automated test'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/gallery/upload",
            headers={"Authorization": f"Bearer {admin_token}"},
            files=files,
            data=data
        )
        assert response.status_code == 200
        result = response.json()
        assert "id" in result
        assert result["title"] == "TEST_AutomatedTestImage"
        print(f"✓ Admin uploaded image: {result['id']}")
        
        # Verify image appears in gallery
        gallery = requests.get(f"{BASE_URL}/api/gallery").json()
        uploaded_ids = [img["id"] for img in gallery]
        assert result["id"] in uploaded_ids
        print("✓ Uploaded image appears in gallery")
        
        # Clean up - delete the test image
        delete_resp = requests.delete(
            f"{BASE_URL}/api/gallery/{result['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_resp.status_code == 200
        print("✓ Test image cleaned up")


class TestContactMessageOperations:
    """Contact message admin operations tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return login_resp.json()["token"]
    
    def test_mark_message_as_read(self, admin_token):
        """Test marking a message as read"""
        # First submit a test message
        test_id = str(uuid.uuid4())[:8]
        requests.post(f"{BASE_URL}/api/contact", json={
            "name": f"TEST_ReadTest_{test_id}",
            "email": f"readtest_{test_id}@example.com",
            "message": f"Test message for read marking {test_id}"
        })
        
        # Get messages to find our test message
        messages = requests.get(
            f"{BASE_URL}/api/contact/messages",
            headers={"Authorization": f"Bearer {admin_token}"}
        ).json()
        
        # Find our test message
        test_msg = next((m for m in messages if f"TEST_ReadTest_{test_id}" in m["name"]), None)
        if test_msg:
            # Mark as read
            response = requests.patch(
                f"{BASE_URL}/api/contact/messages/{test_msg['id']}/read",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            print(f"✓ Message marked as read: {test_msg['id']}")
            
            # Verify it's marked as read
            updated_messages = requests.get(
                f"{BASE_URL}/api/contact/messages",
                headers={"Authorization": f"Bearer {admin_token}"}
            ).json()
            updated_msg = next((m for m in updated_messages if m["id"] == test_msg["id"]), None)
            assert updated_msg["is_read"] == True
            print("✓ Message read status persisted")
        else:
            pytest.skip("Could not find test message")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
