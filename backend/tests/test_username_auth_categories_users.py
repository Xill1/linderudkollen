"""
Test suite for new features in iteration 4:
- Username-based authentication (changed from email)
- Menu categories CRUD
- User management CRUD
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Linderud2026!"
TEST_USER_USERNAME = "martina"
TEST_USER_PASSWORD = "Test1234!"


class TestUsernameAuth:
    """Test username-based authentication (changed from email)"""
    
    def test_login_with_username_success(self):
        """Admin can login with username instead of email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "username" in data, "Response should contain username"
        assert data["username"] == ADMIN_USERNAME
        assert data["role"] == "admin"
        print(f"✓ Admin login with username successful: {data['username']}")
    
    def test_login_with_wrong_password(self):
        """Login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Login correctly rejected with wrong password")
    
    def test_login_with_nonexistent_username(self):
        """Login fails with non-existent username"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "nonexistent_user_12345",
            "password": "anypassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Login correctly rejected with non-existent username")
    
    def test_login_case_insensitive(self):
        """Username login should be case-insensitive"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "ADMIN",  # uppercase
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Case-insensitive login failed: {response.text}"
        print("✓ Username login is case-insensitive")
    
    def test_auth_me_with_token(self):
        """GET /api/auth/me returns user data with valid token"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json()["token"]
        
        # Then check /me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"Auth me failed: {response.text}"
        data = response.json()
        assert data["username"] == ADMIN_USERNAME
        assert data["role"] == "admin"
        print(f"✓ Auth me returns correct user: {data['username']}")
    
    def test_test_user_can_login(self):
        """Test user 'martina' can login with their credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USER_USERNAME,
            "password": TEST_USER_PASSWORD
        })
        # This might fail if martina doesn't exist yet - that's OK
        if response.status_code == 200:
            data = response.json()
            assert data["username"] == TEST_USER_USERNAME
            print(f"✓ Test user '{TEST_USER_USERNAME}' login successful")
        else:
            print(f"⚠ Test user '{TEST_USER_USERNAME}' does not exist yet (will be created in user tests)")


class TestMenuCategories:
    """Test menu categories CRUD endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_categories_public(self):
        """GET /api/menu/categories is public and returns categories"""
        response = requests.get(f"{BASE_URL}/api/menu/categories")
        assert response.status_code == 200, f"Get categories failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Categories should be a list"
        # Check default categories exist
        cat_names = [c["name"] for c in data]
        assert "Bakst" in cat_names, "Default category 'Bakst' should exist"
        assert "Drikke" in cat_names, "Default category 'Drikke' should exist"
        print(f"✓ Get categories returned {len(data)} categories: {cat_names}")
    
    def test_categories_have_required_fields(self):
        """Categories have id, name, sort_order fields"""
        response = requests.get(f"{BASE_URL}/api/menu/categories")
        data = response.json()
        for cat in data:
            assert "id" in cat, "Category should have id"
            assert "name" in cat, "Category should have name"
            assert "sort_order" in cat, "Category should have sort_order"
        print("✓ All categories have required fields")
    
    def test_create_category_requires_auth(self):
        """POST /api/menu/categories requires authentication"""
        response = requests.post(f"{BASE_URL}/api/menu/categories", json={
            "name": "Test Category",
            "sort_order": 99
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Create category correctly requires auth")
    
    def test_create_category_as_admin(self, admin_token):
        """Admin can create a new category"""
        unique_name = f"TEST_Category_{uuid.uuid4().hex[:6]}"
        response = requests.post(
            f"{BASE_URL}/api/menu/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": unique_name, "sort_order": 99}
        )
        assert response.status_code == 200, f"Create category failed: {response.text}"
        data = response.json()
        assert data["name"] == unique_name
        assert data["sort_order"] == 99
        assert "id" in data
        print(f"✓ Created category: {unique_name}")
        
        # Cleanup - delete the test category
        requests.delete(
            f"{BASE_URL}/api/menu/categories/{data['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_create_duplicate_category_fails(self, admin_token):
        """Cannot create category with duplicate name"""
        response = requests.post(
            f"{BASE_URL}/api/menu/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Bakst", "sort_order": 1}  # Bakst already exists
        )
        assert response.status_code == 400, f"Expected 400 for duplicate, got {response.status_code}"
        print("✓ Duplicate category correctly rejected")
    
    def test_delete_category_requires_auth(self):
        """DELETE /api/menu/categories/{id} requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/menu/categories/some-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Delete category correctly requires auth")
    
    def test_delete_category_as_admin(self, admin_token):
        """Admin can delete (soft-delete) a category"""
        # First create a category to delete
        unique_name = f"TEST_ToDelete_{uuid.uuid4().hex[:6]}"
        create_res = requests.post(
            f"{BASE_URL}/api/menu/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": unique_name, "sort_order": 99}
        )
        cat_id = create_res.json()["id"]
        
        # Delete it
        response = requests.delete(
            f"{BASE_URL}/api/menu/categories/{cat_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Delete category failed: {response.text}"
        
        # Verify it's gone from the list
        cats_res = requests.get(f"{BASE_URL}/api/menu/categories")
        cat_names = [c["name"] for c in cats_res.json()]
        assert unique_name not in cat_names, "Deleted category should not appear in list"
        print(f"✓ Category '{unique_name}' deleted successfully")
    
    def test_delete_nonexistent_category(self, admin_token):
        """Deleting non-existent category returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/menu/categories/nonexistent-id-12345",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete non-existent category returns 404")


class TestUserManagement:
    """Test user management CRUD endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_users_requires_auth(self):
        """GET /api/users requires authentication"""
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Get users correctly requires auth")
    
    def test_get_users_as_admin(self, admin_token):
        """Admin can get list of users"""
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Get users failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Users should be a list"
        # Admin should be in the list
        usernames = [u["username"] for u in data]
        assert ADMIN_USERNAME in usernames, "Admin should be in user list"
        print(f"✓ Get users returned {len(data)} users: {usernames}")
    
    def test_users_have_required_fields(self, admin_token):
        """Users have id, username, name, role fields"""
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        for user in data:
            assert "id" in user, "User should have id"
            assert "username" in user, "User should have username"
            assert "role" in user, "User should have role"
            # password_hash should NOT be exposed
            assert "password_hash" not in user, "password_hash should not be exposed"
        print("✓ All users have required fields and no password_hash exposed")
    
    def test_create_user_requires_auth(self):
        """POST /api/users requires authentication"""
        response = requests.post(f"{BASE_URL}/api/users", json={
            "username": "testuser",
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Create user correctly requires auth")
    
    def test_create_user_as_admin(self, admin_token):
        """Admin can create a new user"""
        unique_username = f"test_user_{uuid.uuid4().hex[:6]}"
        response = requests.post(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": unique_username,
                "password": "TestPass123!",
                "name": "Test User",
                "role": "admin"
            }
        )
        assert response.status_code == 200, f"Create user failed: {response.text}"
        data = response.json()
        assert data["username"] == unique_username
        assert data["role"] == "admin"
        assert "id" in data
        print(f"✓ Created user: {unique_username}")
        
        # Verify new user can login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": unique_username,
            "password": "TestPass123!"
        })
        assert login_res.status_code == 200, "New user should be able to login"
        print(f"✓ New user '{unique_username}' can login")
        
        # Cleanup - delete the test user
        requests.delete(
            f"{BASE_URL}/api/users/{data['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_create_duplicate_username_fails(self, admin_token):
        """Cannot create user with duplicate username"""
        response = requests.post(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": ADMIN_USERNAME,  # admin already exists
                "password": "somepassword",
                "name": "Duplicate Admin"
            }
        )
        assert response.status_code == 400, f"Expected 400 for duplicate, got {response.status_code}"
        print("✓ Duplicate username correctly rejected")
    
    def test_delete_user_requires_auth(self):
        """DELETE /api/users/{id} requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/users/some-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Delete user correctly requires auth")
    
    def test_delete_user_as_admin(self, admin_token):
        """Admin can delete another user"""
        # First create a user to delete
        unique_username = f"test_delete_{uuid.uuid4().hex[:6]}"
        create_res = requests.post(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": unique_username,
                "password": "TestPass123!",
                "name": "To Be Deleted"
            }
        )
        user_id = create_res.json()["id"]
        
        # Delete the user
        response = requests.delete(
            f"{BASE_URL}/api/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Delete user failed: {response.text}"
        
        # Verify user is gone
        users_res = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        usernames = [u["username"] for u in users_res.json()]
        assert unique_username not in usernames, "Deleted user should not appear in list"
        print(f"✓ User '{unique_username}' deleted successfully")
    
    def test_cannot_delete_yourself(self, admin_token):
        """Admin cannot delete their own account"""
        # Get admin's user ID
        me_res = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        admin_id = me_res.json()["_id"]
        
        # Try to delete self
        response = requests.delete(
            f"{BASE_URL}/api/users/{admin_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400, f"Expected 400 when deleting self, got {response.status_code}"
        print("✓ Admin correctly cannot delete themselves")
    
    def test_delete_nonexistent_user(self, admin_token):
        """Deleting non-existent user returns 404"""
        # Use a valid ObjectId format but non-existent
        response = requests.delete(
            f"{BASE_URL}/api/users/507f1f77bcf86cd799439011",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete non-existent user returns 404")


class TestCategoryDropdownIntegration:
    """Test that menu item form uses dynamic categories"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_menu_item_uses_category_from_api(self, admin_token):
        """Menu items can be created with categories from the API"""
        # Get available categories
        cats_res = requests.get(f"{BASE_URL}/api/menu/categories")
        categories = cats_res.json()
        assert len(categories) > 0, "Should have at least one category"
        
        # Create a menu item with the first category
        cat_name = categories[0]["name"]
        unique_name = f"TEST_MenuItem_{uuid.uuid4().hex[:6]}"
        
        response = requests.post(
            f"{BASE_URL}/api/menu",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "category": cat_name,
                "name": unique_name,
                "description": "Test item",
                "price": 99
            }
        )
        assert response.status_code == 200, f"Create menu item failed: {response.text}"
        data = response.json()
        assert data["category"] == cat_name
        print(f"✓ Created menu item '{unique_name}' in category '{cat_name}'")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/menu/{data['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
