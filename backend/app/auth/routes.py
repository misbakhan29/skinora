from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    """Create a new user account."""
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    age_range = (data.get("age_range") or "").strip() or None

    # --- Validation ---
    errors = {}
    if not name:
        errors["name"] = "Name is required."
    if not email or "@" not in email:
        errors["email"] = "A valid email is required."
    if len(password) < 8:
        errors["password"] = "Password must be at least 8 characters."
    if errors:
        return jsonify({"errors": errors}), 422

    # --- Uniqueness check ---
    if User.query.filter_by(email=email).first():
        return jsonify({"errors": {"email": "An account with this email already exists."}}), 409

    # --- Create user (password hashed — never stored plaintext) ---
    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        age_range=age_range,
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate an existing user."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Return the currently authenticated user's profile."""
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Stateless JWT logout — client discards the token.
    Included for API completeness; no server-side state to clear.
    """
    return jsonify({"message": "Logged out successfully."}), 200
