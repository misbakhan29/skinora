import json
import os
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required

from app.scraping.engine import update_listings_live
from app.scraping.cache import scraper_cache

products_bp = Blueprint("products", __name__, url_prefix="/products")

_DATA_PATH = os.path.join(os.path.dirname(__file__), "../../data/products.json")
with open(_DATA_PATH, encoding="utf-8") as f:
    PRODUCTS: list[dict] = json.load(f)

PRODUCT_MAP: dict[str, dict] = {p["id"]: p for p in PRODUCTS}


def _best_price(product: dict) -> float:
    """Return the minimum price across platform listings."""
    listings = product.get("platform_listings", [])
    prices = [float(str(l.get("price", 9999)).replace(",", "")) for l in listings]
    return min(prices) if prices else 9999


def _avg_rating(product: dict) -> float:
    """Return weighted average rating across platforms."""
    listings = product.get("platform_listings", [])
    if not listings:
        return 0.0
    total_reviews = sum(l.get("review_count", 0) for l in listings)
    if total_reviews == 0:
        return sum(l.get("rating", 0) for l in listings) / len(listings)
    weighted = sum(l.get("rating", 0) * l.get("review_count", 0) for l in listings)
    return round(weighted / total_reviews, 2)


def _summary(product: dict) -> dict:
    """Lightweight product summary for list views."""
    return {
        "id": product["id"],
        "name": product["name"],
        "brand": product["brand"],
        "step_category": product["step_category"],
        "key_ingredients": product.get("key_ingredients", []),
        "skin_type_fit": product.get("skin_type_fit", []),
        "description": product.get("description", ""),
        "image_url": product.get("image_url", ""),
        "best_price": _best_price(product),
        "avg_rating": _avg_rating(product),
        "platform_count": len(product.get("platform_listings", [])),
        "concerns": product.get("concerns", []),
        "am_pm": product.get("am_pm", "both"),
        "recommendation_reason": product.get("recommendation_reason", "")
    }


@products_bp.route("", methods=["GET"])
@jwt_required()
def list_products():
    """
    List products with optional filters.
    Query params: skin_type, step, ingredient, min_price, max_price, sort (price|rating)
    """
    skin_type = request.args.get("skin_type")
    step = request.args.get("step")
    ingredient = request.args.get("ingredient")
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    sort_by = request.args.get("sort", "rating")  # price | rating

    results = PRODUCTS

    if skin_type:
        results = [p for p in results if skin_type in p.get("skin_type_fit", [])]
    if step:
        results = [p for p in results if p.get("step_category") == step]
    if ingredient:
        results = [p for p in results if ingredient in p.get("key_ingredients", [])]
    if min_price is not None:
        results = [p for p in results if _best_price(p) >= min_price]
    if max_price is not None:
        results = [p for p in results if _best_price(p) <= max_price]

    if sort_by in ("price", "price_asc"):
        results = sorted(results, key=_best_price)
    elif sort_by == "price_desc":
        results = sorted(results, key=_best_price, reverse=True)
    else:
        results = sorted(results, key=_avg_rating, reverse=True)

    return jsonify({
        "products": [_summary(p) for p in results],
        "count": len(results),
    }), 200

@products_bp.route("/recommended", methods=["GET"])
@jwt_required()
def get_recommended_products():
    """
    Get recommended products based on skin_type and concerns.
    Query params: skin_type, concerns (comma-separated)
    """
    skin_type = request.args.get("skin_type")
    concerns_str = request.args.get("concerns", "")
    concerns = [c.strip() for c in concerns_str.split(",") if c.strip()]
    
    if not skin_type:
        return jsonify({"error": "skin_type is required."}), 400
        
    results = [p for p in PRODUCTS if skin_type in p.get("skin_type_fit", [])]
    
    if concerns:
        # Product concerns must overlap with user concerns
        results = [p for p in results if any(c in p.get("concerns", []) for c in concerns)]
        
    results = sorted(results, key=_avg_rating, reverse=True)
    
    # Return top 5 recommendations
    return jsonify({
        "products": [_summary(p) for p in results[:5]],
        "count": min(len(results), 5),
    }), 200


@products_bp.route("/<product_id>", methods=["GET"])
@jwt_required()
def get_product(product_id):
    """Full product detail including all platform listings."""
    product = PRODUCT_MAP.get(product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404

    return jsonify({
        "product": {
            **product,
            "best_price": _best_price(product),
            "avg_rating": _avg_rating(product),
        }
    }), 200


@products_bp.route("/<product_id>/compare", methods=["GET"])
@jwt_required()
def compare_prices(product_id):
    """
    Price comparison table for a product across platforms.
    Sorted cheapest first. If live scraping is enabled, fetches real-time prices.
    """
    product = PRODUCT_MAP.get(product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404

    base_listings = product.get("platform_listings", [])
    
    # Live scraping logic
    if current_app.config.get("FEATURE_LIVE_SCRAPING"):
        listings_to_check = []
        cached_results = []
        
        # Check cache first
        for listing in base_listings:
            cache_key = f"{listing['platform']}:{listing['url']}"
            cached = scraper_cache.get(cache_key)
            if cached:
                merged = {**listing, **cached, "is_live": True, "from_cache": True}
                cached_results.append(merged)
            else:
                listings_to_check.append(listing)
                
        # Fetch remaining live
        if listings_to_check:
            live_updated = update_listings_live(listings_to_check)
            for listing in live_updated:
                if listing.get("is_live"):
                    cache_key = f"{listing['platform']}:{listing['url']}"
                    scraper_cache.set(cache_key, {"price": listing.get("price"), "rating": listing.get("rating")})
                cached_results.append(listing)
        else:
            pass # All were cached
            
        final_listings = cached_results
    else:
        final_listings = base_listings

    listings = sorted(
        final_listings,
        key=lambda l: float(str(l.get("price", 9999)).replace(",", "")),
    )

    return jsonify({
        "product_id": product_id,
        "product_name": product["name"],
        "brand": product["brand"],
        "listings": listings,
        "best_deal": listings[0] if listings else None,
    }), 200
