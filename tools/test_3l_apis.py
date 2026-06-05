import requests

headers = {'User-Agent': 'Mozilla/5.0'}

# Test Vea
print("\n=== VEA ===")
vea_url = "https://www.vea.com.ar/api/catalog_system/pub/products/search/coca cola 3 lt?_from=0&_to=5"
resp = requests.get(vea_url, headers=headers)
try:
    data = resp.json()
    for p in data:
        print("VEA PRODUCT:", p.get("productName"))
        for item in p.get("items", []):
            for seller in item.get("sellers", []):
                offer = seller.get("commertialOffer", {})
                print(f"  Qty: {offer.get('AvailableQuantity')}")
except Exception as e:
    print("Vea failed", e)

# Test Disco
print("\n=== DISCO ===")
disco_url = "https://www.disco.com.ar/api/catalog_system/pub/products/search/coca cola 3 lt?_from=0&_to=5"
resp = requests.get(disco_url, headers=headers)
try:
    data = resp.json()
    for p in data:
        print("DISCO PRODUCT:", p.get("productName"))
        for item in p.get("items", []):
            for seller in item.get("sellers", []):
                offer = seller.get("commertialOffer", {})
                print(f"  Qty: {offer.get('AvailableQuantity')}")
except Exception as e:
    print("Disco failed", e)

# Test Changomas
print("\n=== CHANGOMAS ===")
chango_url = "https://www.masonline.com.ar/api/catalog_system/pub/products/search/coca cola 3 lt?_from=0&_to=5"
resp = requests.get(chango_url, headers=headers)
try:
    data = resp.json()
    for p in data:
        print("CHANGO PRODUCT:", p.get("productName"), p.get("productReference"))
        for item in p.get("items", []):
            print("  EAN:", item.get("ean"))
            for seller in item.get("sellers", []):
                offer = seller.get("commertialOffer", {})
                print(f"  Qty: {offer.get('AvailableQuantity')}")
except Exception as e:
    print("Chango failed", e)
