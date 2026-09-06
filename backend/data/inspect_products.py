import json
import urllib.request

with open('products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total products in JSON: {len(products)}\n")

for p in products:
    img = p.get('image_url', '')
    prices = [l['price'] for l in p.get('platform_listings', [])]
    min_price = min(prices) if prices else 'N/A'
    fit = p.get('skin_type_fit', [])
    
    # test image
    status = "UNKNOWN"
    try:
        req = urllib.request.Request(img, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=2)
        status = f"200 OK ({res.headers.get('Content-Type')})"
    except Exception as e:
        status = f"FAILED: {e}"
        
    print(f"[{p['id']}] {p['brand']} - {p['name']}")
    print(f"   Price: Rs.{min_price} | Skin Types: {fit}")
    print(f"   Image: {img}")
    print(f"   Status: {status}\n")
