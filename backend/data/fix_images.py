import json
import os
import requests
import urllib.parse
import base64

DATA_PATH = os.path.join(os.path.dirname(__file__), "products.json")

def create_letter_placeholder(brand):
    """Generates a simple colored SVG placeholder with the brand's first letter."""
    letter = brand[0].upper() if brand else "?"
    
    # Generate a simple deterministic color based on brand name
    colors = ["#f472b6", "#818cf8", "#34d399", "#fbbf24", "#f87171", "#60a5fa", "#a78bfa"]
    color_idx = sum(ord(c) for c in brand) % len(colors)
    bg_color = colors[color_idx]
    
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect width="100" height="100" fill="{bg_color}"/>
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">{letter}</text>
    </svg>"""
    
    encoded = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{encoded}"

def check_image_url(url):
    """Checks if a URL returns an image content-type."""
    try:
        # Use a realistic user agent
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        # Some servers don't like HEAD, fallback to stream GET if needed, but HEAD is faster
        r = requests.head(url, headers=headers, timeout=5, allow_redirects=True)
        if r.status_code == 200 and r.headers.get('content-type', '').startswith('image/'):
            return True
        # Try GET if HEAD fails or doesn't give content-type
        if r.status_code != 200 or not r.headers.get('content-type', '').startswith('image/'):
            r = requests.get(url, headers=headers, timeout=5, stream=True)
            if r.status_code == 200 and r.headers.get('content-type', '').startswith('image/'):
                return True
    except Exception as e:
        print(f"Error checking image {url}: {e}")
    return False

def search_open_beauty_facts(brand, name):
    """Searches Open Beauty Facts for a product and returns the image URL if found."""
    query = f"{brand} {name}"
    url = f"https://world.openbeautyfacts.org/cgi/search.pl?search_terms={urllib.parse.quote(query)}&search_simple=1&action=process&json=1"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            products = data.get("products", [])
            for product in products:
                img_url = product.get("image_url") or product.get("image_front_url")
                if img_url and check_image_url(img_url):
                    return img_url
    except Exception as e:
        print(f"Error searching Open Beauty Facts for {query}: {e}")
    return None

def main():
    print("Loading products...")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)

    stats = {
        "images_real": 0,
        "images_placeholder": 0,
        "amazon_links_converted": 0
    }

    for p in products:
        print(f"\nProcessing: {p['brand']} - {p['name']}")
        
        # 1. Fix Images
        if p["id"] == "p001":
            p["image_url"] = "https://cdn.shopify.com/s/files/1/0783/8960/8726/files/cerave-foaming-facial-cleanser-limpiadora-espuma-piel-grasa.webp?v=1761180566"
            stats["images_real"] += 1
            print("  - Using predefined CDN link.")
        elif p["id"] == "p015":
            p["image_url"] = "https://cdn.shopify.com/s/files/1/1588/9573/files/COSRX-Advanced-Snail-96-Mucin-Power-Essence-100ml_1.png?v=1772764375"
            stats["images_real"] += 1
            print("  - Using predefined CDN link.")
        else:
            print("  - Searching Open Beauty Facts...")
            img_url = search_open_beauty_facts(p["brand"], p["name"])
            if img_url:
                p["image_url"] = img_url
                stats["images_real"] += 1
                print(f"  - Found real image: {img_url}")
            else:
                p["image_url"] = create_letter_placeholder(p["brand"])
                stats["images_placeholder"] += 1
                print("  - Using letter placeholder.")

        # 2. Fix Amazon Links
        if "platform_listings" in p:
            for listing in p["platform_listings"]:
                if listing["platform"].lower() == "amazon" and "/dp/" in listing["url"]:
                    # Proactively convert to search URL since Amazon blocks automated HEAD/GET reliably
                    query = f"{p['brand']} {p['name']}"
                    search_url = f"https://www.amazon.in/s?k={urllib.parse.quote_plus(query)}"
                    listing["url"] = search_url
                    stats["amazon_links_converted"] += 1
                    print(f"  - Converted Amazon link to search fallback.")

    print("\nSaving products...")
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2)
        
    print("\n=== REPORT ===")
    print(f"Products with real images: {stats['images_real']}")
    print(f"Products with letter placeholders: {stats['images_placeholder']}")
    print(f"Amazon links converted to search fallback: {stats['amazon_links_converted']}")

if __name__ == "__main__":
    main()
