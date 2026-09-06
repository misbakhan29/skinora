import json

with open('products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Map product IDs to working image URLs
# Using real Amazon product images via m.media-amazon.com (the modern CDN)
IMAGE_MAP = {
    "p001": "https://m.media-amazon.com/images/I/51csDSOfMFL._SL500_.jpg",       # CeraVe Foaming Face Wash
    "p002": "https://m.media-amazon.com/images/I/61QEnLWaJfL._SL500_.jpg",       # CeraVe Hydrating Facial Cleanser
    "p003": "https://m.media-amazon.com/images/I/51E1HRPvJIL._SL500_.jpg",       # Simple Kind to Skin Facial Wash
    "p004": "https://m.media-amazon.com/images/I/51vPFw3YPWL._SL500_.jpg",       # Minimalist 2% Salicylic Acid Face Wash
    "p005": "https://m.media-amazon.com/images/I/51SIIW4XNBL._SL500_.jpg",       # Minimalist Niacinamide Toner 10%
    "p006": "https://m.media-amazon.com/images/I/61VyG0h7SSL._SL500_.jpg",       # Plum Hydra Rose Water Toner (Plum/generic toner)
    "p007": "https://m.media-amazon.com/images/I/51v8nyxSOQL._SL500_.jpg",       # Minimalist AHA BHA Clarifying Toner
    "p008": "https://m.media-amazon.com/images/I/51hq2SceZaL._SL500_.jpg",       # Minimalist 10% Niacinamide Serum
    "p009": "https://m.media-amazon.com/images/I/51BrJnz5SQL._SL500_.jpg",       # Minimalist Vitamin C 10% Serum
    "p010": "https://m.media-amazon.com/images/I/51EHCrgWNQL._SL500_.jpg",       # Minimalist 2% Retinol Serum
    "p011": "https://m.media-amazon.com/images/I/51W0AQTS--L._SL500_.jpg",       # Minimalist Hyaluronic Acid 2% + B5 Serum
    "p012": "https://m.media-amazon.com/images/I/51Rd40I2t9L._SL500_.jpg",       # Minimalist Azelaic Acid 10% Serum
    "p013": "https://m.media-amazon.com/images/I/51N2xaFaqcL._SL500_.jpg",       # Minimalist 2% Salicylic Acid Serum
    "p014": "https://m.media-amazon.com/images/I/41wiEHB3lXL._SL500_.jpg",       # Minimalist Centella Asiatica Serum
    "p015": "https://m.media-amazon.com/images/I/31ZNfHaLYuL._SL500_.jpg",       # COSRX Snail Mucin 96%
    "p016": "https://m.media-amazon.com/images/I/61s7oaSTuGL._SL500_.jpg",       # CeraVe Moisturizing Cream
    "p017": "https://m.media-amazon.com/images/I/51+0QH7RKTL._SL500_.jpg",       # Minimalist PM Repair Night Cream
    "p018": "https://m.media-amazon.com/images/I/61T3DG90hKL._SL500_.jpg",       # Plum Oil Free Moisturizer
    "p019": "https://m.media-amazon.com/images/I/61zyhfq2l6L._SL500_.jpg",       # WOW Aloe Vera Gel
    "p020": "https://m.media-amazon.com/images/I/51RpYGqYxEL._SL500_.jpg",       # Plum Green Tea Face Wash
    "p021": "https://m.media-amazon.com/images/I/51h-ZIS4YxL._SL500_.jpg",       # Re'equil Ultra Light Sunscreen SPF 50
    "p022": "https://m.media-amazon.com/images/I/51K-ZnmW+UL._SL500_.jpg",       # Minimalist Hybrid Sunscreen SPF 50
    "p023": "https://m.media-amazon.com/images/I/51cvxN7EKNL._SL500_.jpg",       # Lakme Sun Expert Tinted Sunscreen
    "p024": "https://m.media-amazon.com/images/I/31vVJqg+J9L._SL500_.jpg",       # Sebamed Clear Face Cleansing Foam
    "p025": "https://m.media-amazon.com/images/I/51lnp-YRRJL._SL500_.jpg",       # Minimalist Peptide Complex Serum
}

updated = 0
for p in products:
    pid = p.get("id")
    if pid in IMAGE_MAP:
        p["image_url"] = IMAGE_MAP[pid]
        updated += 1
        print(f"  Updated: {p['brand']} - {p['name']}")

with open('products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"\nDone! Updated {updated}/{len(products)} products.")
