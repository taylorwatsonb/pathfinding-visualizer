import os
from app import app
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    try:
        # Get port from environment, defaulting to 5000
        port = int(os.environ.get('PORT', 5000))
        # In production, disable debug mode and use 0.0.0.0 to make the server publicly accessible
        debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
        logger.info(f"Starting server on port {port} (debug={debug})")
        app.run(
            host='0.0.0.0',
            port=port,
            debug=debug
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise
