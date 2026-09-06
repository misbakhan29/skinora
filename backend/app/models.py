from datetime import datetime
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    age_range = db.Column(db.String(20), nullable=True)  # e.g. "18-24", "25-34"
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    skin_profile = db.relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    quiz_responses = db.relationship("QuizResponse", back_populates="user", cascade="all, delete-orphan")
    routine_sessions = db.relationship("RoutineSession", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "age_range": self.age_range,
            "created_at": self.created_at.isoformat(),
            "skin_profile": self.skin_profile.to_dict() if self.skin_profile else None,
        }


class SkinProfile(db.Model):
    __tablename__ = "skin_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    skin_type = db.Column(db.String(50), nullable=False)  # normal/oily/dry/combination/sensitive/acne_prone
    detection_method = db.Column(db.String(20), nullable=False)  # quiz / camera / manual
    confidence_score = db.Column(db.Float, nullable=True)  # only for camera method
    concerns = db.Column(db.JSON, nullable=True)  # e.g. ["acne", "dryness"]
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="skin_profile")

    def to_dict(self):
        return {
            "skin_type": self.skin_type,
            "detection_method": self.detection_method,
            "confidence_score": self.confidence_score,
            "concerns": self.concerns or [],
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }


class QuizResponse(db.Model):
    __tablename__ = "quiz_responses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    answers = db.Column(db.JSON, nullable=False)  # {question_id: answer_value}
    result_skin_type = db.Column(db.String(50), nullable=False)
    scores = db.Column(db.JSON, nullable=True)  # raw scoring breakdown
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="quiz_responses")

    def to_dict(self):
        return {
            "id": self.id,
            "result_skin_type": self.result_skin_type,
            "scores": self.scores,
            "created_at": self.created_at.isoformat(),
        }


class RoutineSession(db.Model):
    __tablename__ = "routine_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    skin_type = db.Column(db.String(50), nullable=False)
    step_selections = db.Column(db.JSON, nullable=True)  # {step: product_id}
    am_pm = db.Column(db.String(2), default="am")  # "am" or "pm"
    is_saved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="routine_sessions")

    def to_dict(self):
        return {
            "id": self.id,
            "skin_type": self.skin_type,
            "step_selections": self.step_selections,
            "am_pm": self.am_pm,
            "is_saved": self.is_saved,
            "created_at": self.created_at.isoformat(),
        }
