import json
import os
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import QuizResponse, SkinProfile, User

quiz_bp = Blueprint("quiz", __name__, url_prefix="/quiz")

_QUESTIONS_PATH = os.path.join(os.path.dirname(__file__), "../../data/quiz_questions.json")
with open(_QUESTIONS_PATH, encoding="utf-8") as f:
    QUIZ_QUESTIONS: list[dict] = json.load(f)

SKIN_TYPES = ["normal", "oily", "dry", "combination", "sensitive", "acne_prone"]


def score_quiz(answers: dict[str, str]) -> dict:
    """
    Deterministic scoring engine.
    answers: { question_id -> selected option value }
    Returns { result_skin_type, scores }
    """
    totals = {st: 0 for st in SKIN_TYPES}

    question_map = {q["id"]: q for q in QUIZ_QUESTIONS}

    for q_id, selected_value in answers.items():
        question = question_map.get(q_id)
        if not question:
            continue
        option = next((o for o in question["options"] if o["value"] == selected_value), None)
        if not option:
            continue
        for skin_type, points in option.get("scores", {}).items():
            if skin_type in totals:
                totals[skin_type] += points

    # Normalize scores to percentages
    total_points = sum(totals.values()) or 1
    percentages = {st: round((v / total_points) * 100, 1) for st, v in totals.items()}

    result = max(totals, key=lambda st: totals[st])
    return {"result_skin_type": result, "scores": percentages}


@quiz_bp.route("/questions", methods=["GET"])
@jwt_required()
def get_questions():
    """Return the ordered list of quiz questions."""
    return jsonify({"questions": QUIZ_QUESTIONS, "count": len(QUIZ_QUESTIONS)}), 200


@quiz_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit_quiz():
    """
    Submit quiz answers and get a skin type result.
    Body: { "answers": { "q1": "b", "q2": "a", ... } }
    Saves the result to the user's SkinProfile.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    answers = data.get("answers", {})

    if not answers:
        return jsonify({"error": "No answers provided."}), 422

    result = score_quiz(answers)

    # Save quiz response
    quiz_response = QuizResponse(
        user_id=user_id,
        answers=answers,
        result_skin_type=result["result_skin_type"],
        scores=result["scores"],
    )
    db.session.add(quiz_response)

    # Upsert skin profile
    user = User.query.get_or_404(user_id)
    if user.skin_profile:
        user.skin_profile.skin_type = result["result_skin_type"]
        user.skin_profile.detection_method = "quiz"
        user.skin_profile.confidence_score = None
    else:
        profile = SkinProfile(
            user_id=user_id,
            skin_type=result["result_skin_type"],
            detection_method="quiz",
        )
        db.session.add(profile)

    db.session.commit()

    return jsonify({
        "result_skin_type": result["result_skin_type"],
        "scores": result["scores"],
        "quiz_response_id": quiz_response.id,
    }), 200


@quiz_bp.route("/history", methods=["GET"])
@jwt_required()
def quiz_history():
    """Return the user's past quiz results."""
    user_id = int(get_jwt_identity())
    responses = (
        QuizResponse.query.filter_by(user_id=user_id)
        .order_by(QuizResponse.created_at.desc())
        .all()
    )
    return jsonify({"history": [r.to_dict() for r in responses]}), 200
