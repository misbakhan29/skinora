import logging
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)

def scrape_amazon(page, url):
    """Attempt to scrape Amazon price and rating."""
    page.goto(url, wait_until="domcontentloaded", timeout=15000)
    
    # Try multiple selectors for price as it varies by page layout
    price_str = None
    for sel in [".a-price .a-offscreen", "#priceblock_ourprice", "#priceblock_dealprice"]:
        try:
            elem = page.locator(sel).first
            if elem.is_visible():
                price_str = elem.inner_text()
                break
        except Exception:
            pass

    # Try to get rating
    rating_str = None
    try:
        rating_elem = page.locator("span[data-hook='rating-out-of-text']").first
        if rating_elem.is_visible():
            rating_str = rating_elem.inner_text()
    except Exception:
        pass
        
    return _parse_results(price_str, rating_str)


def scrape_nykaa(page, url):
    """Attempt to scrape Nykaa price and rating."""
    page.goto(url, wait_until="domcontentloaded", timeout=15000)
    
    price_str = None
    try:
        # Common Nykaa price selector
        elem = page.locator(".css-1jczs19").first
        if elem.is_visible():
            price_str = elem.inner_text()
    except Exception:
        pass

    rating_str = None
    try:
        # Common Nykaa rating selector
        rating_elem = page.locator(".css-mcmp10").first
        if rating_elem.is_visible():
            rating_str = rating_elem.inner_text()
    except Exception:
        pass
        
    return _parse_results(price_str, rating_str)


def _parse_results(price_str, rating_str):
    result = {}
    if price_str:
        # e.g. "₹599.00" -> 599.0
        clean_price = "".join(c for c in price_str if c.isdigit() or c == ".")
        try:
            result["price"] = float(clean_price)
        except ValueError:
            pass
            
    if rating_str:
        # e.g. "4.2 out of 5" -> 4.2
        try:
            val = float(rating_str.split()[0])
            result["rating"] = val
        except (ValueError, IndexError):
            pass
            
    return result


def fetch_live_data(platform, url):
    """Run a single scraper based on the platform."""
    try:
        with sync_playwright() as p:
            # Use firefox or webkit if chromium is blocked, but chromium is default
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            
            result = {}
            if platform.lower() == "amazon":
                result = scrape_amazon(page, url)
            elif platform.lower() == "nykaa":
                result = scrape_nykaa(page, url)
            
            browser.close()
            return result
    except Exception as e:
        logger.warning(f"Scraping failed for {platform} {url}: {e}")
        return {}


def update_listings_live(listings):
    """
    Takes a list of platform listings, fetches live data for them concurrently,
    and returns a new list of updated listings.
    """
    updated_listings = list(listings)
    
    with ThreadPoolExecutor(max_workers=4) as executor:
        future_to_idx = {
            executor.submit(fetch_live_data, l["platform"], l["url"]): i 
            for i, l in enumerate(updated_listings)
        }
        
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                live_data = future.result()
                if live_data:
                    # Merge live data into the listing
                    if "price" in live_data:
                        updated_listings[idx]["price"] = live_data["price"]
                    if "rating" in live_data:
                        updated_listings[idx]["rating"] = live_data["rating"]
                    updated_listings[idx]["is_live"] = True
            except Exception as e:
                logger.error(f"Thread failed during live update: {e}")
                
    return updated_listings
