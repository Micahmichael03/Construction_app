import logging
import numpy as np
from PIL import Image
from ultralytics import YOLO
import supervision as sv
from openai import AzureOpenAI
import os
from typing import Dict, Tuple, Optional
import base64
import io
import httpx 

# Clear proxy environment variables that might interfere with Azure client
if 'HTTP_PROXY' in os.environ:
    del os.environ['HTTP_PROXY']
if 'HTTPS_PROXY' in os.environ:
    del os.environ['HTTPS_PROXY']

logger = logging.getLogger(__name__)

#Uncomment this part
# Azure OpenAI Configuration - Direct API Key
# AZURE_API_KEY = "7mqqgtt8kGk1msrFDOureWrWSERYsnSoqu8MdV87qLMHrpaHlj07JQQJ99BFACHYHv6XJ3w3AAAAACOG682H"
# AZURE_ENDPOINT = "https://realestateai.openai.azure.com/"
# AZURE_DEPLOYMENT = "o4-mini"

class AIServices:
    def __init__(self):
        self.model = None
        self.box_annotator = None
        self.azure_client = None
        self.construction_items = []
        
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize AI services"""
        self._initialize_yolo()
        self._initialize_azure_openai()
        self._initialize_construction_items()
    
    def _initialize_yolo(self):
        """Initialize YOLOv8 - 11 model"""
        try:
            self.model = YOLO('yolov8n.pt') #input the model path
            self.box_annotator = sv.BoxAnnotator(thickness=3) #input the thickness of the box
            logger.info("YOLOv8 model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load YOLOv8 model: {e}")
            self.model = None
    
    def _initialize_azure_openai(self):
        """Initialize Azure OpenAI client"""
        try:
            if AZURE_API_KEY and AZURE_ENDPOINT and AZURE_DEPLOYMENT:
                # Create client with basic configuration
                self.azure_client = AzureOpenAI(
                    api_key=AZURE_API_KEY,
                    azure_endpoint=AZURE_ENDPOINT,
                    api_version="2024-12-01-preview"
                )
                logger.info("Azure OpenAI client initialized successfully")
            else:
                logger.warning("Azure OpenAI credentials not found")
                self.azure_client = None
        except Exception as e:
            logger.error(f"Failed to initialize Azure OpenAI: {e}")
            self.azure_client = None
    
    def _initialize_construction_items(self):
        """Initialize construction items database"""
        self.construction_items = [
            {"object": "person", "unit_cost": 0, "supplier": ""}, #
            # Structural Materials
            {"object": "Drywall", "unit_cost": 0, "supplier": "https://homehardware.com/drywall"},
            {"object": "Plywood", "unit_cost": 0, "supplier": "https://homedepot.com/plywood"},
            {"object": "2x4 Lumber", "unit_cost": 0, "supplier": "https://lowes.com/lumber"},
            {"object": "Concrete Block", "unit_cost": 0, "supplier": "https://menards.com/concrete-block"},
            {"object": "Rebar", "unit_cost": 0, "supplier": "https://homedepot.com/rebar"},
            
            # Fixtures
            {"object": "Ceiling Fan", "unit_cost": 0, "supplier": "https://homedepot.com/ceiling-fan"},
            {"object": "Sink", "unit_cost": 0, "supplier": "https://lowes.com/sink"},
            {"object": "Toilet", "unit_cost": 0, "supplier": "https://homedepot.com/toilet"},
            {"object": "Shower Head", "unit_cost": 0, "supplier": "https://lowes.com/shower-head"},
            {"object": "Faucet", "unit_cost": 0, "supplier": "https://homedepot.com/faucet"},
            
            # Electrical
            {"object": "Light Switch", "unit_cost": 0, "supplier": "https://lowes.com/light-switch"},
            {"object": "Outlet", "unit_cost": 0, "supplier": "https://homedepot.com/outlet"},
            {"object": "Circuit Breaker", "unit_cost": 0, "supplier": "https://menards.com/circuit-breaker"},
            {"object": "Wire (per ft)", "unit_cost": 0, "supplier": "https://homedepot.com/wire"},
            {"object": "Light Fixture", "unit_cost": 0, "supplier": "https://lowes.com/light-fixture"},
            
            # Plumbing
            {"object": "PVC Pipe", "unit_cost": 0, "supplier": "https://homedepot.com/pvc-pipe"},
            {"object": "Copper Pipe", "unit_cost": 0, "supplier": "https://lowes.com/copper-pipe"},
            {"object": "PEX Pipe", "unit_cost": 0, "supplier": "https://menards.com/pex-pipe"},
            {"object": "Pipe Fitting", "unit_cost": 0, "supplier": "https://homedepot.com/pipe-fitting"},
            {"object": "Valve", "unit_cost": 0, "supplier": "https://lowes.com/valve"},
            
            # Tools
            {"object": "Hammer", "unit_cost": 0, "supplier": "https://homedepot.com/hammer"},
            {"object": "Drill", "unit_cost": 0, "supplier": "https://lowes.com/drill"},
            {"object": "Saw", "unit_cost": 0, "supplier": "https://menards.com/saw"},
            {"object": "Wrench", "unit_cost": 0, "supplier": "https://homedepot.com/wrench"},
            {"object": "Screwdriver", "unit_cost": 0, "supplier": "https://lowes.com/screwdriver"},
            
            # Safety Equipment
            {"object": "Hard Hat", "unit_cost": 0, "supplier": "https://homedepot.com/hard-hat"},
            {"object": "Safety Glasses", "unit_cost": 0, "supplier": "https://lowes.com/safety-glasses"},
            {"object": "Work Gloves", "unit_cost": 0, "supplier": "https://menards.com/work-gloves"},
            {"object": "Safety Vest", "unit_cost": 0, "supplier": "https://homedepot.com/safety-vest"},
            {"object": "Steel Toe Boots", "unit_cost": 0, "supplier": "https://lowes.com/steel-toe-boots"},
            
            # Fasteners
            {"object": "Nails", "unit_cost": 0, "supplier": "https://homedepot.com/nails"},
            {"object": "Screws", "unit_cost": 0, "supplier": "https://lowes.com/screws"},
            {"object": "Bolts", "unit_cost": 0, "supplier": "https://menards.com/bolts"},
            {"object": "Washers", "unit_cost": 0, "supplier": "https://homedepot.com/washers"},
            {"object": "Nuts", "unit_cost": 0, "supplier": "https://lowes.com/nuts"},
            
            # Adhesives & Sealants
            {"object": "Construction Adhesive", "unit_cost": 0, "supplier": "https://homedepot.com/construction-adhesive"},
            {"object": "Silicone Caulk", "unit_cost": 0, "supplier": "https://lowes.com/silicone-caulk"},
            {"object": "Spray Foam", "unit_cost": 0, "supplier": "https://menards.com/spray-foam"},
            {"object": "Liquid Nails", "unit_cost": 0, "supplier": "https://homedepot.com/liquid-nails"},
            {"object": "Gorilla Glue", "unit_cost": 0, "supplier": "https://lowes.com/gorilla-glue"},
            
            # Concrete and Masonry
            {"object": "Concrete Mix", "unit_cost": 0, "supplier": "https://homedepot.com/concrete-mix"},
            {"object": "Mortar", "unit_cost": 0, "supplier": "https://lowes.com/mortar"},
            {"object": "Bricks", "unit_cost": 0, "supplier": "https://menards.com/bricks"},
            {"object": "Sand", "unit_cost": 0, "supplier": "https://homedepot.com/sand"},
            {"object": "Gravel", "unit_cost": 0, "supplier": "https://lowes.com/gravel"},
            
            # Insulation
            {"object": "Fiberglass Insulation", "unit_cost": 0, "supplier": "https://homedepot.com/insulation"},
            {"object": "Foam Board", "unit_cost": 0, "supplier": "https://lowes.com/foam-board"},
            {"object": "Spray Foam", "unit_cost": 0, "supplier": "https://menards.com/spray-foam"},
            {"object": "Vapor Barrier", "unit_cost": 0, "supplier": "https://homedepot.com/vapor-barrier"},
            {"object": "Weather Stripping", "unit_cost": 0, "supplier": "https://lowes.com/weather-stripping"},
            
            # Cabinetry
            {"object": "Kitchen Cabinet", "unit_cost": 0, "supplier": "https://homedepot.com/kitchen-cabinet"},
            {"object": "Bathroom Vanity", "unit_cost": 0, "supplier": "https://lowes.com/bathroom-vanity"},
            {"object": "Drawer Slides", "unit_cost": 0, "supplier": "https://menards.com/drawer-slides"},
            {"object": "Cabinet Knob", "unit_cost": 0, "supplier": "https://homedepot.com/cabinet-knob"},
            {"object": "Pantry Shelf", "unit_cost": 0, "supplier": "https://lowes.com/pantry-shelf"},
            
            # Flooring
            {"object": "Hardwood Flooring", "unit_cost": 0, "supplier": "https://homedepot.com/hardwood-flooring"},
            {"object": "Laminate Flooring", "unit_cost": 0, "supplier": "https://lowes.com/laminate-flooring"},
            {"object": "Vinyl Plank", "unit_cost": 0, "supplier": "https://menards.com/vinyl-plank"},
            {"object": "Carpet (sq yd)", "unit_cost": 0, "supplier": "https://homedepot.com/carpet"},
            {"object": "Underlayment", "unit_cost": 0, "supplier": "https://lowes.com/underlayment"},
            
            # Additional items
            {"object": "Drywall Screws", "unit_cost": 0, "supplier": "https://homedepot.com/drywall-screws"},
            {"object": "Joint Compound", "unit_cost": 0, "supplier": "https://lowes.com/joint-compound"},
            {"object": "Tape Measure", "unit_cost": 0, "supplier": "https://menards.com/tape-measure"},
            {"object": "Level", "unit_cost": 0, "supplier": "https://homedepot.com/level"},
            {"object": "Utility Knife", "unit_cost": 0, "supplier": "https://lowes.com/utility-knife"},
        ]
        logger.info(f"Construction items database initialized with {len(self.construction_items)} items")
    
    def detect_objects(self, image: Image.Image) -> Tuple[Image.Image, Dict[str, int]]:
        """
        Detect objects in image using YOLOv8 -11
        """
        if self.model is None:
            return image, {}
        
        try:
            image_np = np.array(image)
            results = self.model(image_np)
           
            if len(results[0].boxes) > 0:
                detections = sv.Detections(
                    xyxy=results[0].boxes.xyxy.cpu().numpy(),
                    confidence=results[0].boxes.conf.cpu().numpy(),
                    class_id=results[0].boxes.cls.cpu().numpy().astype(int)
                )
                
                construction_item_names = [item["object"] for item in self.construction_items]
                filtered_detections = []
                
                for i in range(len(detections)):
                    class_name = self.model.model.names[detections.class_id[i]]
                    if class_name in construction_item_names:
                        filtered_detections.append((
                            detections.xyxy[i],
                            detections.confidence[i],
                            detections.class_id[i]
                        ))
                
                if filtered_detections:
                    annotated_image = self.box_annotator.annotate(
                        scene=image_np.copy(),
                        detections=sv.Detections(
                            xyxy=np.array([d[0] for d in filtered_detections]),
                            confidence=np.array([d[1] for d in filtered_detections]),
                            class_id=np.array([d[2] for d in filtered_detections])
                        )
                    )
                    
                    detected_items = {}
                    for _, _, class_id in filtered_detections:
                        class_name = self.model.model.names[class_id]
                        detected_items[class_name] = detected_items.get(class_name, 0) + 1
                    
                    return Image.fromarray(annotated_image), detected_items
            
            return image, {}
            
        except Exception as e:
            logger.error(f"Error in object detection: {e}")
            return image, {}
    
    def get_gpt_response(self, image: Image.Image, question: str, detected_items: Dict[str, int], cost_breakdown: list, total_cost: float) -> str:
        """
        Get GPT response for Q&A with enhanced analysis
        """
        if not self.azure_client:
            return "Azure OpenAI service not available. Please check your API credentials."
        
        try:
            # Convert image to base64
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG")
            base64_image = base64.b64encode(buffered.getvalue()).decode()
            
            # Build context
            objects_str = ", ".join([f"{k} ({v})" for k, v in detected_items.items()]) if detected_items else "None"
            
            cost_lines = []
            for item in cost_breakdown:
                cost_lines.append(f"- {item['object']}: {item['quantity']} x ${item['unit_cost']} = ${item['total_cost']} (Supplier: {item['supplier']})")
            cost_breakdown_str = "\n".join(cost_lines) if cost_lines else "No cost items detected."
            
            # Enhanced system prompt with detailed analysis requirements
            system_prompt = f"""
You are a professional construction cost estimator and consultant. Analyze the image and provide comprehensive cost analysis.

First, provide a clear and concise description of what you see in the image (detected objects, scene, and context). Then continue with the following analysis:

The following construction objects were detected in the image:
{objects_str}

Here is the cost breakdown for these items:
{cost_breakdown_str}

The total estimated cost is: ${total_cost}

Your analysis should include:

1. **LABOR ANALYSIS** (use appropriate rates for different trades):
   - **General Labor**: $25-35/hr (basic tasks, moving materials, cleanup)
   - **Carpentry**: $45-65/hr (woodwork, framing, trim work)
   - **Electrical**: $65-85/hr (wiring, installations, safety work)
   - **Plumbing**: $60-80/hr (pipe work, fixtures, connections)
   - **HVAC**: $70-90/hr (heating/cooling systems)
   - **Roofing**: $40-60/hr (shingles, repairs, maintenance)
   - **Painting**: $35-55/hr (interior/exterior painting)
   - **Masonry**: $50-70/hr (brick, concrete, stone work)
   - **Flooring**: $45-65/hr (installation, repairs)
   - **Specialized Equipment**: $75-100/hr (heavy machinery, specialized tools)
   
   - List each task with estimated hours and appropriate labor rate
   - Calculate total labor hours per task
   - Calculate total labor cost (hours × appropriate rate)

2. **MATERIALS ANALYSIS** (SEARCH THE WEB FOR CURRENT PRICES):
   - For each detected item, search the internet for current market prices
   - Search major retailers like Home Depot, Lowe's, Menards, Amazon, etc.
   - Get real-time pricing for the specific items detected
   - List all required materials with current quantities and unit costs
   - Calculate total materials cost using current market prices
   - Include direct supplier links where available

3. **SUMMARY**:
   - Labor cost (broken down by trade if applicable)
   - Materials cost (using current web-sourced prices)
   - Grand total (Labor + Materials)

4. **CRITICAL THINKING & DECISION MAKING**:
   - Cost optimization suggestions based on current market prices
   - Alternative materials or methods with price comparisons
   - Quality vs. cost trade-offs using real market data
   - Timeline considerations
   - Risk assessment

5. **ITEM-SPECIFIC ANALYSIS**:
   - For each detected item, search and provide current market prices
   - Include direct supplier links for purchasing
   - Suggest alternatives or upgrades with price comparisons
   - Provide multiple supplier options when available

IMPORTANT: Start your response with a description of what you see in the image. Then, search the web for current, real-time prices for each detected item. Do not use estimated or outdated prices. Get actual current market prices from major retailers and suppliers.

Be specific, actionable, and provide detailed calculations using current web-sourced prices. Format your response clearly with sections for Description, Labor, Materials, Summary, and Recommendations.
"""
            
            user_prompt = f"User question: {question}\n\nPlease analyze the image and provide a comprehensive cost estimate with detailed breakdowns for labor, materials, and total costs. Include supplier links and recommendations for cost optimization."
            
            logger.info(f"Using Azure deployment: {AZURE_DEPLOYMENT}")
            logger.info(f"Detected items: {detected_items}")
            logger.info(f"Cost breakdown: {cost_breakdown}")
            logger.info(f"Total cost: {total_cost}")
             
            response = self.azure_client.chat.completions.create(
                model=AZURE_DEPLOYMENT,  # Use deployment name as model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ],
                max_completion_tokens=8000  # Increased for more complete responses
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error getting GPT response: {e}")
            return f"Error: Unable to get GPT response. {str(e)}"
    
    def get_construction_items(self) -> list:
        """
        Get construction items database
        """
        return self.construction_items
    
    def is_model_loaded(self) -> bool:
        """
        Check if YOLO model is loaded
        """
        return self.model is not None
    
    def is_azure_available(self) -> bool:
        """
        Check if Azure OpenAI is available
        """
        return self.azure_client is not None 