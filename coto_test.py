import urllib.request
import json
import urllib.parse

url = "https://ac.cnstrc.com/search/sku00568478?key=key_r6xzz4IAoTWcipni&i=miraprecios_bot&s=1&page=1&num_results_per_page=10"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode('utf-8'))
    for item in data.get('response', {}).get('results', []):
        data_field = item.get('data', {})
        print(data_field.get('sku_display_name'))
        print("store_availability len:", len(data_field.get('store_availability', [])))
