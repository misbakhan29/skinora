import json
import os
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import RoutineSession, SkinProfile, User

routine_bp = Blueprint("routine", __name__, url_prefix="/routine")

_PROFILES_PATH = os.path.join(os.path.dirname(__file__), "../../data/skin_profiles.json")
_INGREDIENTS_PATH = os.path.join(os.path.dirname(__file__), "../../data/ingredients.json")

with open(_PROFILES_PATH, encoding="utf-8") as f:
    SKIN_PROFILES: dict = json.load(f)

with open(_INGREDIENTS_PATH, encoding="utf-8") as f:
    INGREDIENTS: list[dict] = json.load(f)

INGREDIENT_MAP: dict[str, dict] = {i["id"]: i for i in INGREDIENTS}

STEP_META = {
    "cleanser": {
        "order": 1,
        "label": "Cleanser",
        "icon": "🧴",
        "description": "The foundation of every routine. Removes dirt, oil, sunscreen, and dead skin cells without stripping your skin barrier.",
        "am_included": True,
        "pm_included": True,
        "skippable": False,
    },
    "toner": {
        "order": 2,
        "label": "Toner",
        "icon": "💧",
        "description": "Balances skin pH after cleansing, preps skin to absorb serums better, and can deliver targeted hydration or mild exfoliation.",
        "am_included": True,
        "pm_included": True,
        "skippable": True,
    },
    "serum": {
        "order": 3,
        "label": "Serum / Treatment",
        "icon": "✨",
        "description": "The workhorse of your routine. Concentrated actives that target your specific concerns — oil control, brightening, anti-aging, acne, or hydration.",
        "am_included": True,
        "pm_included": True,
        "skippable": False,
    },
    "moisturizer": {
        "order": 4,
        "label": "Moisturizer",
        "icon": "🌿",
        "description": "Seals in the benefits of your serum and maintains your skin's moisture barrier. Choose texture based on your skin type.",
        "am_included": True,
        "pm_included": True,
        "skippable": False,
    },
    "sunscreen": {
        "order": 5,
        "label": "Sunscreen",
        "icon": "☀️",
        "description": "The single most important anti-aging and skin-protective product. Always the final step in your AM routine. SPF 30+ minimum, SPF 50 recommended.",
        "am_included": True,
        "pm_included": False,
        "skippable": False,
    },
}

SUITABILITY_RANK = {
    "highly_recommended": 4,
    "recommended": 3,
    "recommended_with_caution": 2,
    "caution": 1,
    "avoid": 0,
}


def _get_step_ingredients(step: str, skin_type: str) -> list[dict]:
    """Return ingredients for a given step, sorted by suitability for this skin type."""
    step_ings = [i for i in INGREDIENTS if i.get("category") == step]
    result = []
    for ing in step_ings:
        suitability = ing.get("suitability_by_skin_type", {}).get(skin_type, "recommended")
        rank = SUITABILITY_RANK.get(suitability, 2)
        if rank >= 1:  # exclude "avoid"
            result.append({
                "id": ing["id"],
                "name": ing["name"],
                "function": ing["function"],
                "suitability": suitability,
                "rank": rank,
            })
    return sorted(result, key=lambda x: x["rank"], reverse=True)


@routine_bp.route("/steps", methods=["GET"])
@jwt_required()
def get_steps():
    """
    Return the ordered routine steps with ingredient recommendations.
    Query params: skin_type (required), time=am|pm (default: am)
    """
    skin_type = request.args.get("skin_type")
    time_of_day = request.args.get("time", "am").lower()

    if not skin_type or skin_type not in SKIN_PROFILES:
        return jsonify({"error": "Valid skin_type required (normal/oily/dry/combination/sensitive/acne_prone)."}), 422

    profile = SKIN_PROFILES[skin_type]
    steps = []

    for step_id, meta in sorted(STEP_META.items(), key=lambda x: x[1]["order"]):
        # Filter steps by time of day
        if time_of_day == "am" and not meta["am_included"]:
            continue
        if time_of_day == "pm" and not meta["pm_included"]:
            continue

        # Step requirement logic
        user_concerns = profile.get("concerns", [])
        if isinstance(user_concerns, list) == False:
            # Note: profile here is from SKIN_PROFILES JSON which doesn't have concerns,
            # we need the user's actual SkinProfile DB model concerns. Let's fetch it.
            pass

        # We need the user's DB profile for concerns
        user_db_profile = None
        try:
            from flask_jwt_extended import get_jwt_identity
            from app.models import User
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if user and user.skin_profile:
                user_db_profile = user.skin_profile
        except:
            pass
        
        user_concerns = user_db_profile.concerns if user_db_profile and user_db_profile.concerns else []
        
        is_required = False
        is_recommended = False
        
        if step_id in ["cleanser", "moisturizer"]:
            is_required = True
        elif step_id == "sunscreen" and time_of_day == "am":
            is_required = True
        elif step_id == "toner":
            if skin_type in ["oily", "combination", "acne_prone"]:
                is_recommended = True
        elif step_id == "serum":
            if len(user_concerns) > 0:
                is_recommended = True
        
        # Override skippable based on new logic
        meta_skippable = not is_required

        ingredients = _get_step_ingredients(step_id, skin_type)

        steps.append({
            "step_id": step_id,
            "order": meta["order"],
            "label": meta["label"],
            "icon": meta["icon"],
            "description": meta["description"],
            "skippable": meta_skippable,
            "is_required": is_required,
            "is_recommended": is_recommended,
            "ingredients": ingredients[:6],  # top 6 per step
        })

    return jsonify({
        "skin_type": skin_type,
        "skin_profile": {
            "label": profile["label"],
            "description": profile["description"],
            "am_notes": profile.get("am_notes", ""),
            "pm_notes": profile.get("pm_notes", ""),
        },
        "time_of_day": time_of_day,
        "steps": steps,
    }), 200


@routine_bp.route("/save", methods=["POST"])
@jwt_required()
def save_routine():
    """
    Save a completed routine session.
    Body: { "skin_type": "oily", "step_selections": {"cleanser": "p_001", ...}, "am_pm": "am" }
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    skin_type = data.get("skin_type")
    step_selections = data.get("step_selections", {})
    am_pm = data.get("am_pm", "am")

    if not skin_type:
        return jsonify({"error": "skin_type is required."}), 422

    session = RoutineSession(
        user_id=user_id,
        skin_type=skin_type,
        step_selections=step_selections,
        am_pm=am_pm,
        is_saved=True,
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({"message": "Routine saved.", "routine": session.to_dict()}), 201


@routine_bp.route("/saved", methods=["GET"])
@jwt_required()
def get_saved_routines():
    """Return the user's saved routines."""
    user_id = int(get_jwt_identity())
    sessions = (
        RoutineSession.query.filter_by(user_id=user_id, is_saved=True)
        .order_by(RoutineSession.created_at.desc())
        .all()
    )
    return jsonify({"routines": [s.to_dict() for s in sessions]}), 200


@routine_bp.route("/set-skin-type", methods=["POST"])
@jwt_required()
def set_skin_type_manually():
    """
    Experienced user path — set skin type directly without quiz.
    Body: { "skin_type": "oily" }
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    skin_type = data.get("skin_type", "").lower()

    if skin_type not in SKIN_PROFILES:
        return jsonify({"error": "Invalid skin type."}), 422

    user = User.query.get_or_404(user_id)
    if user.skin_profile:
        user.skin_profile.skin_type = skin_type
        user.skin_profile.detection_method = "manual"
        user.skin_profile.confidence_score = None
    else:
        profile = SkinProfile(
            user_id=user_id,
            skin_type=skin_type,
            detection_method="manual",
        )
        db.session.add(profile)

    db.session.commit()
    return jsonify({"skin_type": skin_type, "message": "Skin type saved."}), 200


@routine_bp.route("/set-concerns", methods=["POST"])
@jwt_required()
def set_concerns():
    """
    Save user's skin concerns.
    Body: { "concerns": ["acne", "dryness"] }
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    concerns = data.get("concerns", [])
    
    if not isinstance(concerns, list):
        return jsonify({"error": "concerns must be a list of strings."}), 422
        
    user = User.query.get_or_404(user_id)
    if user.skin_profile:
        user.skin_profile.concerns = concerns
    else:
        # If no skin profile exists yet, create an empty one with just concerns? 
        # Usually they should have a skin type first.
        profile = SkinProfile(
            user_id=user_id,
            skin_type="normal", # fallback
            detection_method="manual",
            concerns=concerns
        )
        db.session.add(profile)
        
    db.session.commit()
    return jsonify({"concerns": concerns, "message": "Concerns saved."}), 200


@routine_bp.route("/check-own-product", methods=["POST"])
@jwt_required()
def check_own_product():
    """
    Check an external product for ingredient conflicts.
    """
    data = request.get_json(silent=True) or {}
    skin_type = data.get("skin_type", "normal")
    ingredients = data.get("ingredients", [])

    if not ingredients:
        return jsonify({"status": "saved_without_check", "conflicts": []}), 200

    conflicts_found = []
    known_ids = []
    
    for ing_input in ingredients:
        ing_clean = ing_input.strip().lower().replace(" ", "_")
        if ing_clean in INGREDIENT_MAP:
            known_ids.append(ing_clean)
        else:
            for k, v in INGREDIENT_MAP.items():
                if v["name"].lower() == ing_input.strip().lower():
                    known_ids.append(k)
                    break
    
    if not known_ids:
        return jsonify({"status": "saved_without_check", "conflicts": []}), 200

    for ing_id in known_ids:
        ing = INGREDIENT_MAP[ing_id]
        suitability = ing.get("suitability_by_skin_type", {}).get(skin_type, "recommended")
        if suitability in ["avoid", "caution"]:
            conflicts_found.append({
                "type": "suitability",
                "ingredient": ing["name"],
                "severity": suitability,
                "message": f"{ing['name']} is marked as '{suitability}' for {skin_type} skin."
            })
            
    status = "has_conflicts" if conflicts_found else "safe"
    return jsonify({"status": status, "conflicts": conflicts_found}), 200
