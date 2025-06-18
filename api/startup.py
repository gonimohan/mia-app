#!/usr/bin/env python3
"""
Startup script for the Market Intelligence Agent API
"""

import os
import sys
import logging
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def check_environment():
    """Check if all required environment variables are set"""
    required_vars = [
        "NEWS_API_KEY",
        "MEDIASTACK_API_KEY", 
        "GNEWS_API_KEY",
        "ALPHA_VANTAGE_API_KEY",
        "FINANCIAL_MODELING_PREP_API_KEY",
        "SERPAPI_API_KEY",
        "TAVILY_API_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.warning(f"Missing environment variables: {', '.join(missing_vars)}")
        logger.info("The API will still work but with limited functionality")
    else:
        logger.info("All environment variables are configured")

def main():
    """Main startup function"""
    logger.info("Starting Market Intelligence Agent API...")
    
    # Check environment
    check_environment()
    
    # Import and run the FastAPI app
    try:
        from main import app
        import uvicorn
        
        port = int(os.getenv("PORT", 8000))
        host = os.getenv("HOST", "0.0.0.0")
        
        logger.info(f"Starting server on {host}:{port}")
        uvicorn.run(app, host=host, port=port, reload=True)
        
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
