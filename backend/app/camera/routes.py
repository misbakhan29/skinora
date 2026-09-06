"""
Camera-based skin type detection endpoint.
Milestone 6 scaffold — accepts an image, runs a placeholder classifier,
and returns a skin type + confidence score.

When a real MobileNetV2 model is trained, replace the `_placeholder_inference`
function with a call to `model_inference.predict(image_tensor)`.
The API contract remains unchanged.
"""
import io
import os
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import SkinProfile, User

camera_bp = Blueprint("camera", __name__, url_prefix="/camera")

FEATURE_LIVE_MODEL = os.environ.get("FEATURE_CAMERA_MODEL", "false").lower() == "true"

SKIN_TYPES = ["normal", "oily", "dry", "combination", "sensitive", "acne_prone"]


def _placeholder_inference(image_bytes: bytes) -> dict:
    """
    Placeholder model inference.
    In production, replace this with:
        from ml.inference import predict
        return predict(image_bytes)
    """
    # Deterministic result based on image size mod to simulate variation
    idx = len(image_bytes) % len(SKIN_TYPES)
    return {
        "skin_type": SKIN_TYPES[idx],
        "confidence": 0.52,
        "all_scores": {st: round(1 / len(SKIN_TYPES), 3) for st in SKIN_TYPES},
        "is_placeholder": True,
    }


@camera_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_image():
    """
    Analyze a face photo to predict skin type.
    Accepts: multipart/form-data with a 'photo' file field.
    Privacy: image is processed in memory only, never written to disk or stored.

    Returns: skin_type, confidence, suggest_quiz_fallback (if confidence < 0.65)
    """
    if "photo" not in request.files:
        return jsonify({"error": "No photo file provided. Send a 'photo' field as multipart/form-data."}), 400

    photo = request.files["photo"]

    # Read into memory only — never persisted to disk
    image_bytes = photo.read()

    if not image_bytes:
        return jsonify({"error": "Empty image file."}), 400

    # Run inference (placeholder or real model)
    if FEATURE_LIVE_MODEL:
        try:
            from ml.inference import predict
            result = predict(image_bytes)
        except ImportError:
            return jsonify({"error": "ML model not available. Train and install the model first."}), 503
    else:
        result = _placeholder_inference(image_bytes)

    confidence = result.get("confidence", 0.0)
    skin_type = result.get("skin_type", "normal")
    suggest_quiz = confidence < 0.65

    response_payload = {
        "skin_type": skin_type,
        "confidence": round(confidence, 3),
        "confidence_label": _confidence_label(confidence),
        "suggest_quiz_fallback": suggest_quiz,
        "all_scores": result.get("all_scores", {}),
        "privacy_note": "Your photo was analyzed in real time and was never stored on our servers.",
    }

    if result.get("is_placeholder"):
        response_payload["note"] = "Camera model is in development. This is a placeholder result — please use the quiz for an accurate skin type."

    # If confidence is acceptable, optionally auto-save to profile
    if not suggest_quiz:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if user:
            if user.skin_profile:
                user.skin_profile.skin_type = skin_type
                user.skin_profile.detection_method = "camera"
                user.skin_profile.confidence_score = confidence
            else:
                profile = SkinProfile(
                    user_id=user_id,
                    skin_type=skin_type,
                    detection_method="camera",
                    confidence_score=confidence,
                )
                db.session.add(profile)
            db.session.commit()

    return jsonify(response_payload), 200


def _confidence_label(confidence: float) -> str:
    if confidence >= 0.85:
        return "High"
    elif confidence >= 0.65:
        return "Moderate"
    else:
        return "Low — we recommend confirming with the quiz"
