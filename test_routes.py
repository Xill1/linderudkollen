import requests
import json

# Test route conflicts
base_url = "https://task-continue-12.preview.emergentagent.com"

# Login first
login_response = requests.post(f"{base_url}/api/auth/login", json={
    "username": "admin", 
    "password": "Linderud2026!"
})
token = login_response.json()['token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

print("🔍 Testing route conflicts...")

# Test if /api/menu/reorder is being interpreted as /api/menu/{item_id}
print("\n1. Testing /api/menu/reorder endpoint directly:")
test_data = {
    "items": [
        {"id": "test-id-1", "sort_order": 1},
        {"id": "test-id-2", "sort_order": 2}
    ]
}

response = requests.put(f"{base_url}/api/menu/reorder", json=test_data, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

# Test if /api/menu/categories/reorder is being interpreted as /api/menu/categories/{cat_id}
print("\n2. Testing /api/menu/categories/reorder endpoint directly:")
test_data = {
    "items": [
        {"id": "test-cat-1", "sort_order": 1},
        {"id": "test-cat-2", "sort_order": 2}
    ]
}

response = requests.put(f"{base_url}/api/menu/categories/reorder", json=test_data, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

print("\n✅ Route conflict test complete")