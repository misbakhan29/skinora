import json
import os
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

ingredients_bp = Blueprint("ingredients", __name__, url_prefix="/ingredients")

# Load ingredient data once at module level
_DATA_PATH = os.path.join(os.path.dirname(__file__), "../../data/ingredients.json")
with open(_DATA_PATH, encoding="utf-8") as f:
    INGREDIENTS: list[dict] = json.load(f)

INGREDIENT_MAP: dict[str, dict] = {ing["id"]: ing for ing in INGREDIENTS}

SUITABILITY_RANK = {
    "highly_recommended": 4,
    "recommended": 3,
    "recommended_with_caution": 2,
    "caution": 1,
    "avoid": 0,
}


def _filter_suitability(ing: dict, skin_type: str) -> str:
    return ing.get("suitability_by_skin_type", {}).get(skin_type, "recommended")


@ingredients_bp.route("", methods=["GET"])
@jwt_required()
def list_ingredients():
    """List all ingredients, optionally filtered by skin_type and/or category."""
    skin_type = request.args.get("skin_type")
    category = request.args.get("category")
    min_suitability = request.args.get("min_suitability", "caution")

    results = INGREDIENTS

    if category:
        results = [i for i in results if i.get("category") == category]

    if skin_type:
        min_rank = SUITABILITY_RANK.get(min_suitability, 1)
        results = [
            i for i in results
            if SUITABILITY_RANK.get(_filter_suitability(i, skin_type), 1) >= min_rank
        ]
        # Sort: most suitable first
        results = sorted(
            results,
            key=lambda i: SUITABILITY_RANK.get(_filter_suitability(i, skin_type), 1),
            reverse=True,
        )
        # Annotate with the skin-type suitability for convenience
        results = [
            {**i, "suitability": _filter_suitability(i, skin_type)} for i in results
        ]

    return jsonify({"ingredients": results, "count": len(results)}), 200


@ingredients_bp.route("/<ingredient_id>", methods=["GET"])
@jwt_required()
def get_ingredient(ingredient_id):
    """Get full detail for a single ingredient."""
    ing = INGREDIENT_MAP.get(ingredient_id)
    if not ing:
        return jsonify({"error": "Ingredient not found."}), 404

    skin_type = request.args.get("skin_type")
    result = dict(ing)
    if skin_type:
        result["suitability"] = _filter_suitability(ing, skin_type)

    return jsonify({"ingredient": result}), 200


@ingredients_bp.route("/check-conflict", methods=["POST"])
@jwt_required()
def check_conflict():
    """
    Check ingredient conflicts for a given skin type.
    Body: { "ingredients": ["niacinamide", "vitamin_c"], "skin_type": "sensitive" }
    Returns a list of conflicts with severity overridden for the given skin type.
    """
    data = request.get_json(silent=True) or {}
    ingredient_ids: list[str] = data.get("ingredients", [])
    skin_type: str = data.get("skin_type", "normal")

    if not ingredient_ids:
        return jsonify({"conflicts": []}), 200

    conflicts_found = []
    seen_pairs = set()

    for ing_id in ingredient_ids:
        ing = INGREDIENT_MAP.get(ing_id)
        if not ing:
            continue
        for conflict in ing.get("conflicts", []):
            partner_id = conflict.get("with")
            if partner_id not in ingredient_ids:
                continue
            pair_key = tuple(sorted([ing_id, partner_id]))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            # Apply skin-type severity override
            severity = conflict.get("skin_type_overrides", {}).get(
                skin_type, conflict.get("default_severity", "safe")
            )

            if severity != "safe":
                conflicts_found.append({
                    "ingredient_a": ing_id,
                    "ingredient_b": partner_id,
                    "severity": severity,
                    "reason": conflict.get("reason", ""),
                })

    return jsonify({"conflicts": conflicts_found, "skin_type": skin_type}), 200
