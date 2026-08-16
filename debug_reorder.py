import requests
import json

# Test the reorder endpoints more specifically
base_url = "https://task-continue-12.preview.emergentagent.com"

# Login first
login_response = requests.post(f"{base_url}/api/auth/login", json={
    "username": "admin", 
    "password": "Linderud2026!"
})
token = login_response.json()['token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

print("🔍 Debugging reorder endpoints...")

# Get current categories
print("\n1. Getting current categories:")
categories_response = requests.get(f"{base_url}/api/menu/categories", headers=headers)
categories = categories_response.json()
print(f"Categories found: {len(categories)}")
for cat in categories:
    print(f"  - {cat['name']} (ID: {cat['id']}, sort_order: {cat.get('sort_order', 'N/A')})")

# Get current menu items
print("\n2. Getting current menu items:")
menu_response = requests.get(f"{base_url}/api/menu", headers=headers)
menu_data = menu_response.json()
items = menu_data.get('items', [])
print(f"Menu items found: {len(items)}")
for item in items[:5]:  # Show first 5
    print(f"  - {item['name']} (ID: {item['id']}, category: {item['category']}, sort_order: {item.get('sort_order', 'N/A')})")

# Test category reordering with actual data
if len(categories) >= 2:
    print("\n3. Testing category reordering with actual categories:")
    cat1, cat2 = categories[0], categories[1]
    reorder_data = {
        "items": [
            {"id": cat1['id'], "sort_order": 2},
            {"id": cat2['id'], "sort_order": 1}
        ]
    }
    print(f"Reordering: {cat1['name']} -> sort_order 2, {cat2['name']} -> sort_order 1")
    print(f"Request data: {json.dumps(reorder_data, indent=2)}")
    
    reorder_response = requests.put(f"{base_url}/api/menu/categories/reorder", 
                                   json=reorder_data, headers=headers)
    print(f"Response status: {reorder_response.status_code}")
    print(f"Response: {reorder_response.text}")

# Test menu item reordering with actual data
bakst_items = [item for item in items if item['category'] == 'Bakst']
if len(bakst_items) >= 2:
    print("\n4. Testing menu item reordering with actual items:")
    item1, item2 = bakst_items[0], bakst_items[1]
    reorder_data = {
        "items": [
            {"id": item1['id'], "sort_order": 2},
            {"id": item2['id'], "sort_order": 1}
        ]
    }
    print(f"Reordering: {item1['name']} -> sort_order 2, {item2['name']} -> sort_order 1")
    print(f"Request data: {json.dumps(reorder_data, indent=2)}")
    
    reorder_response = requests.put(f"{base_url}/api/menu/reorder", 
                                   json=reorder_data, headers=headers)
    print(f"Response status: {reorder_response.status_code}")
    print(f"Response: {reorder_response.text}")

print("\n✅ Debug complete")