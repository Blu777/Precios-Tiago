import requests
import json

base_url = "https://www.jumbo.com.ar"
# Search for Coca Cola 600ml
url = f"{base_url}/api/catalog_system/pub/products/search/coca-cola"
headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0'
}

response = requests.get(url, headers=headers)
data = response.json()

found = False
for product in data:
    name = product.get('productName', '').lower()
    if '600' in name and 'coca' in name:
        print(f"FOUND: {product['productName']}")
        skus = product.get('items', [])
        for sku in skus:
            print(f"  SKU: {sku.get('itemId')}")
            print(f"  EAN: {sku.get('ean')}")
            for ref in sku.get('referenceId', []):
                print(f"  Ref: {ref}")
            print(f"  Categories: {product.get('categories')}")
        found = True

if not found:
    print("Not found in direct search.")
