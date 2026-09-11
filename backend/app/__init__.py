from flask import Flask
from config import get_config
from app.extensions import db, migrate, jwt, cors


def create_app():
    app = Flask(__name__)

    cfg = get_config()
    app.config.from_object(cfg)

    # -- Init extensions --
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    cors.init_app(
        app,
        resources={r"/*": {"origins": cfg.FRONTEND_URL}},
        supports_credentials=True,
    )

    # -- Register blueprints --
    from app.auth.routes import auth_bp
    from app.ingredients.routes import ingredients_bp
    from app.quiz.routes import quiz_bp
    from app.routine.routes import routine_bp
    from app.products.routes import products_bp
    from app.camera.routes import camera_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(ingredients_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(routine_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(camera_bp)

    # -- Health check --
    @app.route("/health")
    def health():
        return {"status": "ok", "app": "Skinora API"}, 200

    # -- Import models so Flask-Migrate / SQLAlchemy can detect them --
    from app import models  # noqa: F401

    # -- Create database tables if they don't exist --
    with app.app_context():
        db.create_all()

    return app