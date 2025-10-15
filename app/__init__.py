from flask import Flask
from config import Config
from app.models import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    
    from app.routes import main_routes
    app.register_blueprint(main_routes)
    
    with app.app_context():
        db.create_all()
    
    return app