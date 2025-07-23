from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
import uvicorn
import logging
import os
from datetime import datetime
from PIL import Image
import io
from fastapi.staticfiles import StaticFiles

# Local imports
from models import DetectionResponse, QAResponse, HealthResponse, ItemsResponse
from security import get_api_key
from ai_services import AIServices
from utils import image_to_base64, calculate_costs, get_recommendations
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Construction AI Object Detection API",
    description="AI-powered construction object detection and cost estimation API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI services
ai_services = AIServices()
 
# API endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Construction AI Object Detection API", "status": "healthy"}

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        model_loaded=ai_services.is_model_loaded(),
        version="1.0.0"
    )

@app.post("/detect", response_model=DetectionResponse)
async def detect_objects_endpoint(
    file: UploadFile = File(...)
    # api_key: str = Depends(get_api_key)  # Temporarily disabled for testing
):
    """Detect objects in uploaded image and provide cost estimation"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image (jpg, jpeg, png, bmp, gif, webp, etc.)")
        
        # Read and process image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Detect objects using AI services
        annotated_image, detected_items = ai_services.detect_objects(image)
        print("[DEBUG] Detected classes:", detected_items)  # DEBUG: Print detected classes
        
        # Calculate costs
        cost_breakdown, total_cost = calculate_costs(detected_items, ai_services.get_construction_items())
        
        # Get recommendations
        recommendations = get_recommendations(detected_items, ai_services.get_construction_items())
        
        # Convert annotated image to base64
        annotated_image_b64 = image_to_base64(annotated_image)
        
        return DetectionResponse(
            success=True,
            detected_objects=detected_items,
            annotated_image=annotated_image_b64,
            cost_breakdown=cost_breakdown,
            total_cost=total_cost,
            recommendations=recommendations,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Detection error: {e}")
        return DetectionResponse(
            success=False,
            detected_objects={},
            annotated_image="",
            cost_breakdown=[],
            total_cost=0.0,
            recommendations="",
            error=str(e),
            timestamp=datetime.now()
        )

@app.post("/qa", response_model=QAResponse)
async def qa_endpoint(
    file: UploadFile = File(...),
    question: str = None
    # api_key: str = Depends(get_api_key)  # Temporarily disabled for testing
):
    """Ask questions about an image using GPT"""
    try:
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Detect objects for context
        _, detected_items = ai_services.detect_objects(image)
        cost_breakdown, total_cost = calculate_costs(detected_items, ai_services.get_construction_items())
        
        # Get GPT response
        answer = ai_services.get_gpt_response(image, question, detected_items, cost_breakdown, total_cost)
        
        return QAResponse(
            success=True,
            answer=answer,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"QA error: {e}")
        return QAResponse(
            success=False,
            answer="",
            error=str(e),
            timestamp=datetime.now()
        ) 

@app.get("/items", response_model=ItemsResponse)
async def get_construction_items():
    # api_key: str = Depends(get_api_key)  # Temporarily disabled for testing
    """Get list of all construction items in database"""
    items = ai_services.get_construction_items()
    return ItemsResponse(
        items=items,
        count=len(items)
    )

# app.mount("/", StaticFiles(directory="../frontend", html=True), name="static")

@app.get("/frontend-config")
async def frontend_config():
    return {"API_BASE_URL": "https://localhost:8000"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 