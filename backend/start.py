#!/usr/bin/env python3
"""
Startup script for Construction AI Object Detection API
"""

import uvicorn
import os
from dotenv import load_dotenv
 
# Load environment variables
load_dotenv() # Load environment variables from .env file

def main():
    """Main startup function"""
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("DEBUG", "False").lower() == "true"
    
    print(f"🚀 Starting Construction AI Object Detection API")
    print(f"📍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🔄 Reload: {reload}")
    print(f"📖 API Docs: http://{host}:{port}/docs")
    print(f"🔍 Health Check: http://{host}:{port}/health")
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )

if __name__ == "__main__":
    main() 