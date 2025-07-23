from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
 
class DetectionRequest(BaseModel):
    """Request model for object detection"""
    question: Optional[str] = Field(None, description="Optional question for Q&A")

class CostItem(BaseModel):
    """Model for cost breakdown items"""
    object: str = Field(..., description="Object name")
    quantity: int = Field(..., description="Quantity detected")
    unit_cost: float = Field(..., description="Unit cost in USD")
    total_cost: float = Field(..., description="Total cost for this item")
    supplier: str = Field(..., description="Supplier URL")

class DetectionResponse(BaseModel):
    """Response model for object detection"""
    success: bool = Field(..., description="Whether the detection was successful")
    detected_objects: Dict[str, int] = Field(..., description="Detected objects and their counts")
    annotated_image: str = Field(..., description="Base64 encoded annotated image")
    cost_breakdown: List[CostItem] = Field(..., description="Cost breakdown for detected items")
    total_cost: float = Field(..., description="Total estimated cost")
    recommendations: str = Field(..., description="AI-generated recommendations")
    error: Optional[str] = Field(None, description="Error message if detection failed")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp of the request")

class QAResponse(BaseModel):
    """Response model for Q&A endpoint"""
    success: bool = Field(..., description="Whether the Q&A was successful")
    answer: str = Field(..., description="AI-generated answer")
    error: Optional[str] = Field(None, description="Error message if Q&A failed")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp of the request")

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Current timestamp")
    model_loaded: bool = Field(..., description="Whether YOLO model is loaded")
    version: str = Field(default="1.0.0", description="API version")

class ConstructionItem(BaseModel):
    """Model for construction items in database"""
    object: str = Field(..., description="Object name")
    unit_cost: float = Field(..., description="Unit cost in USD")
    supplier: str = Field(..., description="Supplier URL")

class ItemsResponse(BaseModel):
    """Response model for construction items endpoint"""
    items: List[ConstructionItem] = Field(..., description="List of construction items")
    count: int = Field(..., description="Total number of items")

class ErrorResponse(BaseModel):
    """Standard error response model"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp of the error") 