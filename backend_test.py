import requests
import sys
import json
from datetime import datetime

class LinderudkollenAPITester:
    def __init__(self, base_url="https://task-continue-12.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            print(f"   Status: {response.status_code}")
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                    return False, error_data
                except:
                    print(f"   Error: {response.text}")
                    return False, response.text

        except Exception as e:
            print(f"❌ Failed - Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        return self.run_test("API Health Check", "GET", "api/", 200)

    def test_admin_login(self):
        """Test admin login with username"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": "admin", "password": "Linderud2026!"}
        )
        if success and isinstance(response, dict) and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_menu_categories(self):
        """Test getting menu categories"""
        return self.run_test("Get Menu Categories", "GET", "api/menu/categories", 200)

    def test_get_menu_items(self):
        """Test getting menu items"""
        return self.run_test("Get Menu Items", "GET", "api/menu", 200)

    def test_create_test_category(self):
        """Create a test category for reordering"""
        success, response = self.run_test(
            "Create Test Category",
            "POST",
            "api/menu/categories",
            200,
            data={"name": "Test Kategori", "sort_order": 999}
        )
        if success and isinstance(response, dict):
            return response.get('id')
        return None

    def test_create_test_menu_items(self, category_name="Bakst"):
        """Create test menu items for reordering"""
        items = []
        for i in range(2):
            success, response = self.run_test(
                f"Create Test Menu Item {i+1}",
                "POST",
                "api/menu",
                200,
                data={
                    "category": category_name,
                    "name": f"Test Vare {i+1}",
                    "description": f"Test beskrivelse {i+1}",
                    "price": 50 + i*10,
                    "is_available": True,
                    "sort_order": 900 + i
                }
            )
            if success and isinstance(response, dict):
                items.append(response.get('id'))
        return items

    def test_reorder_categories(self, category_ids):
        """Test category reordering endpoint"""
        if len(category_ids) < 2:
            print("⚠️  Need at least 2 categories to test reordering")
            return False
        
        # Reverse the order
        reorder_data = {
            "items": [
                {"id": category_ids[1], "sort_order": 1},
                {"id": category_ids[0], "sort_order": 2}
            ]
        }
        
        success, response = self.run_test(
            "Reorder Categories",
            "PUT",
            "api/menu/categories/reorder",
            200,
            data=reorder_data
        )
        return success

    def test_reorder_menu_items(self, item_ids):
        """Test menu items reordering endpoint"""
        if len(item_ids) < 2:
            print("⚠️  Need at least 2 menu items to test reordering")
            return False
        
        # Reverse the order
        reorder_data = {
            "items": [
                {"id": item_ids[1], "sort_order": 1},
                {"id": item_ids[0], "sort_order": 2}
            ]
        }
        
        success, response = self.run_test(
            "Reorder Menu Items",
            "PUT",
            "api/menu/reorder",
            200,
            data=reorder_data
        )
        return success

    def test_get_users(self):
        """Test getting users (admin only)"""
        return self.run_test("Get Users", "GET", "api/users", 200)

    def test_get_messages(self):
        """Test getting contact messages"""
        return self.run_test("Get Contact Messages", "GET", "api/contact/messages", 200)

    def cleanup_test_data(self, category_id, item_ids):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test menu items
        for item_id in item_ids:
            if item_id:
                self.run_test(f"Delete Test Item {item_id}", "DELETE", f"api/menu/{item_id}", 200)
        
        # Delete test category
        if category_id:
            self.run_test(f"Delete Test Category {category_id}", "DELETE", f"api/menu/categories/{category_id}", 200)

def main():
    print("🚀 Starting Linderudkollen API Tests")
    print("=" * 50)
    
    tester = LinderudkollenAPITester()
    
    # Test basic health
    success, _ = tester.test_health_check()
    if not success:
        print("❌ API health check failed, stopping tests")
        return 1

    # Test admin login
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1

    # Test basic endpoints
    tester.test_get_menu_categories()
    tester.test_get_menu_items()
    tester.test_get_users()
    tester.test_get_messages()

    # Get existing categories for reorder testing
    success, categories_response = tester.test_get_menu_categories()
    existing_categories = []
    if success and isinstance(categories_response, list):
        existing_categories = [cat.get('id') for cat in categories_response if cat.get('id')]

    # Create test category
    test_category_id = tester.test_create_test_category()
    
    # Test category reordering with existing categories
    if len(existing_categories) >= 1 and test_category_id:
        test_categories = existing_categories[:1] + [test_category_id]
        tester.test_reorder_categories(test_categories)

    # Get existing menu items for reorder testing
    success, menu_response = tester.test_get_menu_items()
    existing_items = []
    if success and isinstance(menu_response, dict) and 'items' in menu_response:
        existing_items = [item.get('id') for item in menu_response['items'] if item.get('id')]

    # Create test menu items
    test_item_ids = tester.test_create_test_menu_items()
    
    # Test menu items reordering
    if len(existing_items) >= 1 and len(test_item_ids) >= 1:
        test_items = existing_items[:1] + test_item_ids
        tester.test_reorder_menu_items(test_items)
    elif len(test_item_ids) >= 2:
        tester.test_reorder_menu_items(test_item_ids)

    # Clean up test data
    tester.cleanup_test_data(test_category_id, test_item_ids)

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())