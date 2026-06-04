import urllib.request
import urllib.parse
import json

queries = [
    "Carrefour_logo.svg",
    "Carrefour_logo.png",
    "Carrefour_Logo.svg",
    "Coto_logo.png",
    "Coto_(supermercado)_logo.png",
    "Supermercados_Coto_logo.svg",
    "ChangoMas_logo.png",
    "Changomas_logo.svg"
]

headers = {'User-Agent': 'Mozilla/5.0'}

for q in queries:
    url = f"https://es.wikipedia.org/w/api.php?action=query&titles=Archivo:{urllib.parse.quote(q)}&prop=imageinfo&iiprop=url&format=json"
    try:
        req = urllib.request.Request(url, headers=headers)
        response = urllib.request.urlopen(req)
        res = json.loads(response.read().decode('utf-8'))
        pages = res['query']['pages']
        for page_id, page_data in pages.items():
            if 'imageinfo' in page_data:
                print(f"{q}: {page_data['imageinfo'][0]['url']}")
            else:
                pass
    except Exception as e:
        print(f"{q}: Error {e}")
