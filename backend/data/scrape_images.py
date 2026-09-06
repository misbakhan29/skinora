import json
import urllib.request
import re

def scrape_amazon_image(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        match = re.search(r'data-a-dynamic-image="\{&quot;(https://m\.media-amazon\.com/images/I/[^&]+?\.jpg)', html)
        if match:
            return match.group(1)
        match = re.search(r'id="landingImage" data-old-hires="([^"]+)"', html)
        if match:
            return match.group(1)
    except Exception as e:
        print(f"Error scraping {url}: {e}")
    return None

with open('products.json', 'r') as f:
    products = json.load(f)

for p in products:
    print(f"Checking {p['name']}...")
    amazon_listing = next((l for l in p['platform_listings'] if l['platform'].lower() == 'amazon'), None)
    if amazon_listing:
        img_url = scrape_amazon_image(amazon_listing['url'])
        if img_url:
            p['image_url'] = img_url
            print(f"Found image: {img_url}")
        else:
            print(f"Could not find image for {p['name']}")
    else:
        print(f"No Amazon listing for {p['name']}")

with open('products_updated.json', 'w') as f:
    json.dump(products, f, indent=2)
