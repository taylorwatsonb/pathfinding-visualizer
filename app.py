import os
import logging
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "a secret key"

# Configure SQLAlchemy
if os.environ.get("DATABASE_URL"):
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    db.init_app(app)
    logger.info("Database initialized successfully")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/pathfind', methods=['POST'])
def pathfind():
    data = request.get_json()
    start = data.get('start')
    end = data.get('end')
    algorithm = data.get('algorithm', 'astar')
    grid_data = data.get('grid')
    
    # Return empty path if missing data
    if not all([start, end, grid_data]):
        return jsonify({'error': 'Missing required data'}), 400
    
    return jsonify({'path': [], 'visited': []})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
