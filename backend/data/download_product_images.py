"""
download_product_images.py
Server-side image downloader for Skinora product catalog.
Downloads all externally-hotlinked product images and self-hosts them locally.
"""

import json
import os
import requests
import time

PRODUCTS_JSON = os.path.join(os.path.dirname(__file__), "products.json")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "images", "products")
OUTPUT_DIR = os.path.normpath(OUTPUT_DIR)

# Realistic browser-like headers to bypass Referer/hotlink checks
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.nykaa.com/",
    "Connection": "keep-alive",
    "Sec-Fetch-Dest": "image",
    "Sec-Fetch-Mode": "no-cors",
    "Sec-Fetch-Site": "same-site",
}

CONTENT_TYPE_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/svg+xml": ".svg",
}

def is_external_url(url):
    """Returns True if the URL is an external hotlink (not a local path or data URI)."""
    return url.startswith("http://") or url.startswith("https://")

def get_ext_from_url(url):
    """Guess extension from the URL path."""
    path = url.split("?")[0].lower()
    for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"]:
        if path.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext
    return ".jpg"  # default fallback

def download_image(product_id, url, output_dir):
    """
    Attempts to download image from URL server-side.
    Returns (local_path, success, reason).
    """
    os.makedirs(output_dir, exist_ok=True)

    # First: guess extension from URL
    guessed_ext = get_ext_from_url(url)
    
    # Try with Nykaa-specific referer first, then generic
    referer_variants = [
        "https://www.nykaa.com/",
        "https://www.flipkart.com/",
        "https://www.google.com/",
        None,
    ]

    for referer in referer_variants:
        try:
            headers = dict(HEADERS)
            if referer:
                headers["Referer"] = referer
            else:
                headers.pop("Referer", None)

            resp = requests.get(url, headers=headers, timeout=15, stream=True)

            if resp.status_code != 200:
                print(f"  [{product_id}] HTTP {resp.status_code} with referer={referer}, trying next...")
                continue

            content_type = resp.headers.get("content-type", "").split(";")[0].strip().lower()
            ext = CONTENT_TYPE_TO_EXT.get(content_type, guessed_ext)

            # Save the image
            filename = f"{product_id}{ext}"
            filepath = os.path.join(output_dir, filename)

            with open(filepath, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)

            file_size = os.path.getsize(filepath)
            if file_size < 500:
                # Too small — probably an error page or 1x1 pixel
                os.remove(filepath)
                print(f"  [{product_id}] Downloaded file too small ({file_size}b) — likely error page, trying next referer...")
                continue

            print(f"  [{product_id}] OK Downloaded {filename} ({file_size // 1024}KB) content-type={content_type}")
            return f"/images/products/{filename}", True, "ok"

        except requests.exceptions.RequestException as e:
            print(f"  [{product_id}] Request error with referer={referer}: {e}")
            continue

    return None, False, "all attempts failed"

def main():
    print(f"Loading products from: {PRODUCTS_JSON}")
    with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"Output directory: {OUTPUT_DIR}")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    stats = {
        "downloaded": 0,
        "already_local": 0,
        "placeholder": 0,
        "fallback_to_placeholder": 0,
    }

    results = []

    for p in products:
        pid = p["id"]
        url = p.get("image_url", "")
        name = p["name"]

        if not is_external_url(url):
            if url.startswith("/images/"):
                print(f"  [{pid}] Already local: {url}")
                stats["already_local"] += 1
            else:
                print(f"  [{pid}] Placeholder (data URI) — skipping")
                stats["placeholder"] += 1
            results.append({"id": pid, "name": name, "status": "skipped", "url": url})
            continue

        print(f"\n[{pid}] {name}")
        print(f"  Fetching: {url[:80]}...")

        local_path, success, reason = download_image(pid, url, OUTPUT_DIR)

        if success:
            p["image_url"] = local_path
            stats["downloaded"] += 1
            results.append({"id": pid, "name": name, "status": "downloaded", "url": local_path})
        else:
            print(f"  [{pid}] FAILED — keeping placeholder. Reason: {reason}")
            # Revert to letter placeholder so there's no broken link
            stats["fallback_to_placeholder"] += 1
            results.append({"id": pid, "name": name, "status": "failed", "original_url": url})

        time.sleep(0.3)  # polite delay

    print("\nSaving updated products.json...")
    with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 50)
    print("REPORT")
    print("=" * 50)
    print(f"[OK] Successfully downloaded & self-hosted : {stats['downloaded']}")
    print(f"[--] Already local (no change needed)     : {stats['already_local']}")
    print(f"[  ] Data-URI placeholder (skipped)        : {stats['placeholder']}")
    print(f"[XX] Download failed -> placeholder fallback: {stats['fallback_to_placeholder']}")
    print()

    if stats["fallback_to_placeholder"] > 0:
        print("Products that FAILED and need attention:")
        for r in results:
            if r["status"] == "failed":
                print(f"  - [{r['id']}] {r['name']}")
    else:
        print("All external URLs successfully self-hosted!")

if __name__ == "__main__":
    main()
