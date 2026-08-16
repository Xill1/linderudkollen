"""
Backend API Tests for Menu System - Linderudkollen Sportsstue
Tests: GET/POST/PUT/DELETE /api/menu endpoints
Categories: Bakst, Varm mat, Drikke, Spesielt
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@linderudkollen.no"
ADMIN_PASSWORD = "Linderud2026!"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin token for authenticated requests"""
    login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
    return login_resp.json()["token"]


class TestMenuPublicEndpoint:
    """Public menu endpoint tests - GET /api/menu"""
    
    def test_get_menu_returns_items_and_categories(self):
        """Test GET /api/menu returns items grouped by categories"""
        response = requests.get(f"{BASE_URL}/api/menu")
        assert response.status_code == 200, f"GET /api/menu failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "items" in data, "Response missing 'items' field"
        assert "categories" in data, "Response missing 'categories' field"
        assert isinstance(data["items"], list), "items should be a list"
        assert isinstance(data["categories"], dict), "categories should be a dict"
        
        print(f"✓ GET /api/menu returns {len(data['items'])} items")
        print(f"  Categories: {list(data['categories'].keys())}")
        
        return data
    
    def test_menu_has_expected_categories(self):
        """Test menu has the expected categories: Bakst, Varm mat, Drikke, Spesielt"""
        response = requests.get(f"{BASE_URL}/api/menu")
        data = response.json()
        
        expected_categories = ['Bakst', 'Varm mat', 'Drikke', 'Spesielt']
        actual_categories = list(data["categories"].keys())
        
        for cat in expected_categories:
            assert cat in actual_categories, f"Missing expected category: {cat}"
        
        print(f"✓ All expected categories present: {expected_categories}")
    
    def test_menu_items_have_required_fields(self):
        """Test menu items have all required fields"""
        response = requests.get(f"{BASE_URL}/api/menu")
        data = response.json()
        
        required_fields = ["id", "category", "name", "is_available"]
        
        for item in data["items"]:
            for field in required_fields:
                assert field in item, f"Menu item missing field: {field}"
        
        print(f"✓ All {len(data['items'])} items have required fields")
    
    def test_menu_seeded_with_default_items(self):
        """Test menu is seeded with default items on startup"""
        response = requests.get(f"{BASE_URL}/api/menu")
        data = response.json()
        
        # Should have at least 10 seeded items
        assert len(data["items"]) >= 10, f"Expected at least 10 seeded items, got {len(data['items'])}"
        
        # Check for some expected seeded items
        item_names = [item["name"] for item in data["items"]]
        expected_items = ["Kaffe", "Kanelsnurr", "Dagens kraftsuppe"]
        
        for expected in expected_items:
            assert expected in item_names, f"Missing expected seeded item: {expected}"
        
        print(f"✓ Menu seeded with {len(data['items'])} default items")
        print(f"  Found expected items: {expected_items}")


class TestMenuCreateEndpoint:
    """Menu item creation tests - POST /api/menu"""
    
    def test_create_menu_item_requires_auth(self):
        """Test POST /api/menu requires authentication"""
        response = requests.post(f"{BASE_URL}/api/menu", json={
            "category": "Bakst",
            "name": "Test Item",
            "price": 50
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/menu requires authentication")
    
    def test_create_menu_item_as_admin(self, admin_token):
        """Test admin can create a new menu item"""
        test_id = str(uuid.uuid4())[:8]
        new_item = {
            "category": "Bakst",
            "name": f"TEST_Item_{test_id}",
            "description": "Test item created by automated test",
            "price": 99,
            "is_available": True,
            "sort_order": 100
        }
        
        response = requests.post(
            f"{BASE_URL}/api/menu",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json=new_item
        )
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response missing 'id'"
        assert data["name"] == new_item["name"], "Name mismatch"
        assert data["category"] == new_item["category"], "Category mismatch"
        assert data["price"] == new_item["price"], "Price mismatch"
        assert data["is_available"] == new_item["is_available"], "Availability mismatch"
        
        print(f"✓ Created menu item: {data['name']} (id: {data['id']})")
        
        # Verify item appears in GET /api/menu
        menu_resp = requests.get(f"{BASE_URL}/api/menu")
        menu_data = menu_resp.json()
        item_ids = [item["id"] for item in menu_data["items"]]
        assert data["id"] in item_ids, "Created item not found in menu"
        print("✓ Created item appears in menu list")
        
        return data["id"]
    
    def test_create_menu_item_with_null_price(self, admin_token):
        """Test creating menu item with null price (e.g., 'Spør oss')"""
        test_id = str(uuid.uuid4())[:8]
        new_item = {
            "category": "Spesielt",
            "name": f"TEST_NullPrice_{test_id}",
            "description": "Item with no fixed price",
            "price": None,
            "is_available": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/menu",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json=new_item
        )
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        
        assert data["price"] is None, "Price should be null"
        print(f"✓ Created item with null price: {data['name']}")
        
        return data["id"]


class TestMenuUpdateEndpoint:
    """Menu item update tests - PUT /api/menu/{id}"""
    
    def test_update_menu_item_requires_auth(self):
        """Test PUT /api/menu/{id} requires authentication"""
        response = requests.put(f"{BASE_URL}/api/menu/some-id", json={
            "name": "Updated Name"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ PUT /api/menu/{id} requires authentication")
    
    def test_update_menu_item_as_admin(self, admin_token):
        """Test admin can update a menu item"""
        # First create an item to update
        test_id = str(uuid.uuid4())[:8]
        create_resp = requests.post(
            f"{BASE_URL}/api/menu",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json={
                "category": "Drikke",
                "name": f"TEST_ToUpdate_{test_id}",
                "price": 50
            }
        )
        item_id = create_resp.json()["id"]
        
        # Update the item
        update_data = {
            "name": f"TEST_Updated_{test_id}",
            "price": 75,
            "description": "Updated description"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/menu/{item_id}",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json=update_data
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        print(f"✓ Updated menu item: {item_id}")
        
        # Verify update persisted
        menu_resp = requests.get(f"{BASE_URL}/api/menu")
        menu_data = menu_resp.json()
        updated_item = next((item for item in menu_data["items"] if item["id"] == item_id), None)
        
        assert updated_item is not None, "Updated item not found"
        assert updated_item["name"] == update_data["name"], "Name not updated"
        assert updated_item["price"] == update_data["price"], "Price not updated"
        assert updated_item["description"] == update_data["description"], "Description not updated"
        
        print(f"✓ Update persisted: name={updated_item['name']}, price={updated_item['price']}")
        
        return item_id
    
    def test_update_item_availability(self, admin_token):
        """Test updating item availability (mark as unavailable)"""
        # Create an item
        test_id = str(uuid.uuid4())[:8]
        create_resp = requests.post(
            f"{BASE_URL}/api/menu",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json={
                "category": "Bakst",
                "name": f"TEST_Availability_{test_id}",
                "price": 40,
                "is_available": True
            }
        )
        item_id = create_resp.json()["id"]
        
        # Mark as unavailable
        response = requests.put(
            f"{BASE_URL}/api/menu/{item_id}",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json={"is_available": False}
        )
        assert response.status_code == 200
        
        # Verify
        menu_resp = requests.get(f"{BASE_URL}/api/menu")
        menu_data = menu_resp.json()
        item = next((i for i in menu_data["items"] if i["id"] == item_id), None)
        
        assert item is not None, "Item not found"
        assert item["is_available"] == False, "Availability not updated"
        
        print(f"✓ Item marked as unavailable: {item_id}")
        
        return item_id
    
    def test_update_nonexistent_item(self, admin_token):
        """Test updating a non-existent item returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/menu/nonexistent-id-12345",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json={"name": "Test"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Update non-existent item returns 404")


class TestMenuDeleteEndpoint:
    """Menu item deletion tests - DELETE /api/menu/{id}"""
    
    def test_delete_menu_item_requires_auth(self):
        """Test DELETE /api/menu/{id} requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/menu/some-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ DELETE /api/menu/{id} requires authentication")
    
    def test_delete_menu_item_as_admin(self, admin_token):
        """Test admin can soft-delete a menu item"""
        # First create an item to delete
        test_id = str(uuid.uuid4())[:8]
        create_resp = requests.post(
            f"{BASE_URL}/api/menu",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json={
                "category": "Drikke",
                "name": f"TEST_ToDelete_{test_id}",
                "price": 30
            }
        )
        item_id = create_resp.json()["id"]
        
        # Delete the item
        response = requests.delete(
            f"{BASE_URL}/api/menu/{item_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Delete failed: {response.text}"
        
        print(f"✓ Deleted menu item: {item_id}")
        
        # Verify item no longer appears in menu (soft delete)
        menu_resp = requests.get(f"{BASE_URL}/api/menu")
        menu_data = menu_resp.json()
        item_ids = [item["id"] for item in menu_data["items"]]
        
        assert item_id not in item_ids, "Deleted item still appears in menu"
        print("✓ Deleted item no longer appears in menu list")
    
    def test_delete_nonexistent_item(self, admin_token):
        """Test deleting a non-existent item returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/menu/nonexistent-id-12345",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete non-existent item returns 404")


class TestMenuCRUDFlow:
    """Full CRUD flow test for menu items"""
    
    def test_full_crud_flow(self, admin_token):
        """Test complete Create -> Read -> Update -> Delete flow"""
        test_id = str(uuid.uuid4())[:8]
        
        # CREATE
        create_data = {
            "category": "Varm mat",
            "name": f"TEST_CRUD_{test_id}",
            "description": "Full CRUD test item",
            "price": 129,
            "is_available": True,
            "sort_order": 50
        }
        
        create_resp = requests.post(
            f"{BASE_URL}/api/menu",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json=create_data
        )
        assert create_resp.status_code == 200
        item_id = create_resp.json()["id"]
        print(f"✓ CREATE: {item_id}")
        
        # READ - Verify in list
        read_resp = requests.get(f"{BASE_URL}/api/menu")
        items = read_resp.json()["items"]
        created_item = next((i for i in items if i["id"] == item_id), None)
        assert created_item is not None
        assert created_item["name"] == create_data["name"]
        assert created_item["price"] == create_data["price"]
        print(f"✓ READ: Found item with correct data")
        
        # UPDATE
        update_data = {
            "name": f"TEST_CRUD_Updated_{test_id}",
            "price": 149,
            "is_available": False
        }
        
        update_resp = requests.put(
            f"{BASE_URL}/api/menu/{item_id}",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json=update_data
        )
        assert update_resp.status_code == 200
        
        # Verify update
        verify_resp = requests.get(f"{BASE_URL}/api/menu")
        items = verify_resp.json()["items"]
        updated_item = next((i for i in items if i["id"] == item_id), None)
        assert updated_item["name"] == update_data["name"]
        assert updated_item["price"] == update_data["price"]
        assert updated_item["is_available"] == False
        print(f"✓ UPDATE: Item updated and verified")
        
        # DELETE
        delete_resp = requests.delete(
            f"{BASE_URL}/api/menu/{item_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_resp.status_code == 200
        
        # Verify deletion
        final_resp = requests.get(f"{BASE_URL}/api/menu")
        final_items = final_resp.json()["items"]
        deleted_item = next((i for i in final_items if i["id"] == item_id), None)
        assert deleted_item is None
        print(f"✓ DELETE: Item removed from menu")
        
        print("✓ Full CRUD flow completed successfully")


class TestMenuCleanup:
    """Cleanup test items created during testing"""
    
    def test_cleanup_test_items(self, admin_token):
        """Clean up all TEST_ prefixed items"""
        menu_resp = requests.get(f"{BASE_URL}/api/menu")
        items = menu_resp.json()["items"]
        
        test_items = [item for item in items if item["name"].startswith("TEST_")]
        
        for item in test_items:
            requests.delete(
                f"{BASE_URL}/api/menu/{item['id']}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
        
        print(f"✓ Cleaned up {len(test_items)} test items")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
