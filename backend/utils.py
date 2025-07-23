import base64
import io
import logging
from PIL import Image
import numpy as np
from typing import Dict, List, Tuple, Optional
import cv2

logger = logging.getLogger(__name__)

def image_to_base64(image: Image.Image) -> str:
    """
    Convert PIL image to base64 string
    """
    try:
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return img_str
    except Exception as e:
        logger.error(f"Error converting image to base64: {e}")
        raise

def base64_to_image(base64_string: str) -> Image.Image:
    """
    Convert base64 string to PIL image
    """
    try:
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        return image
    except Exception as e:
        logger.error(f"Error converting base64 to image: {e}")
        raise

def resize_image(image: Image.Image, max_size: int = 1024) -> Image.Image:
    """
    Resize image while maintaining aspect ratio
    """
    try:
        width, height = image.size
        if width <= max_size and height <= max_size:
            return image
        
        # Calculate new dimensions
        if width > height:
            new_width = max_size
            new_height = int(height * max_size / width)
        else:
            new_height = max_size
            new_width = int(width * max_size / height)
        
        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    except Exception as e:
        logger.error(f"Error resizing image: {e}")
        return image

def validate_image_file(file_content: bytes, max_size_mb: int = 10) -> bool:
    """
    Validate uploaded image file
    """
    try:
        # Check file size
        if len(file_content) > max_size_mb * 1024 * 1024:
            return False
        
        # Try to open as image
        image = Image.open(io.BytesIO(file_content))
        image.verify()
        return True
    except Exception as e:
        logger.error(f"Image validation failed: {e}")
        return False

def calculate_costs(detected_items: Dict[str, int], construction_items: List[Dict]) -> Tuple[List[Dict], float]:
    """
    Calculate cost breakdown for detected items
    """
    cost_breakdown = []
    total_cost = 0.0
    
    try:
        for item_name, quantity in detected_items.items():
            # Find matching item in database
            matching_items = [
                item for item in construction_items 
                if item["object"].lower() == item_name.lower()
            ]
            
            if matching_items:
                item = matching_items[0]
                if item["unit_cost"] > 0 and item["supplier"]:
                    cost = item["unit_cost"] * quantity
                    total_cost += cost
                    cost_breakdown.append({
                        "object": item["object"],
                        "quantity": quantity,
                        "unit_cost": item["unit_cost"],
                        "total_cost": cost,
                        "supplier": item["supplier"]
                    })
        
        return cost_breakdown, total_cost
    except Exception as e:
        logger.error(f"Error calculating costs: {e}")
        return [], 0.0

def get_recommendations(detected_items: Dict[str, int], construction_items: List[Dict]) -> str:
    """
    Generate recommendations based on detected items
    """
    if not detected_items:
        return "No construction objects detected in this image."
    
    # --- OLD PAINT-SPECIFIC LOGIC (COMMENTED OUT) ---
    # # Check for 'paint' or 'painting' in detected items
    # for item_name in detected_items:
    #     if 'paint' in item_name.lower() or 'painting' in item_name.lower():
    #         # Return the provided estimate text
    #         return (
    #             "Here's an estimate to repaint an average‐size bedroom (approx. 12′×14′ with 8′ ceilings) from its current off‐white to a new neutral on walls, ceiling and all trim. I've assumed you want two coats on the walls and trim (for good coverage) and one coat on the ceiling, plus full prep, masking and cleanup.\n\n"
    #             "Labor (at $75/hr)\n"
    #             "• Move & protect furniture, floors, fixtures: 1.5 hrs\n"
    #             "• Patch nail holes, sand & spot‐prime repairs: 1.5 hrs\n"
    #             "• Mask/window & door trim & cover floors: 1.0 hr\n"
    #             "• Prime walls (new neutral tint): 2.0 hrs\n"
    #             "• Paint walls (2 coats): 4.0 hrs\n"
    #             "• Paint ceiling (1 coat): 2.0 hrs\n"
    #             "• Paint trim & casing (2 coats): 2.5 hrs\n"
    #             "• Final touch-up & cleanup: 1.5 hrs\n"
    #             "––\n"
    #             "Total labor hours: 16.0 hrs\n"
    #             "Labor cost: 16 × $75 = $1,200\n\n"
    #             "Materials\n"
    #             "• Interior primer (1 gal tinted): $25\n"
    #             "• Wall paint (3 gal @ $35/gal): $105\n"
    #             "• Ceiling paint (1 gal): $30\n"
    #             "• Trim paint (1 qt): $15\n"
    #             "• Masking tape, drop cloths, sandpaper, blades, sundries: $25\n"
    #             "––\n"
    #             "Total materials ≈ $200\n\n"
    #             "Summary\n"
    #             "• Labor: $1,200\n"
    #             "• Materials: $200\n"
    #             "• Grand total ≈ $1,400\n\n"
    #             "Notes:\n\n"
    #             "If the existing color is very light and you're staying with white‐to‐white, you can skip the primer and save about $75 and 2 hrs of labor.\n"
    #             "Heavily textured ceilings or extra‐thick brush & roller work (crown molding, ornate casing) could add 1–2 hrs.\n"
    #             "This assumes normal wall condition; extensive repair (water damage, wallpaper removal) would increase time & cost."
    #         )
    # --- END OLD PAINT-SPECIFIC LOGIC ---
    
    # --- OLD RECOMMENDATION LOGIC (COMMENTED OUT) ---
    # recommendations = []
    # try:
    #     for item_name, quantity in detected_items.items():
    #         matching_items = [
    #             item for item in construction_items 
    #             if item["object"].lower() == item_name.lower()
    #         ]
    #         
    #         if matching_items:
    #             item = matching_items[0]
    #             
    #             if item["unit_cost"] == 0 or not item["supplier"]:
    #                 continue
    #             
    #             # Generate recommendations based on item type
    #             if "hammer" in item_name.lower():
    #                 recommendations.append(
    #                     f"🔨 {item_name}: Store in a dry, secure location. "
    #                     f"Consider a tool belt or toolbox for easy access."
    #                 )
    #             elif "drill" in item_name.lower():
    #                 recommendations.append(
    #                     f"🔧 {item_name}: Keep batteries charged and store in a protective case. "
    #                     f"Regular maintenance recommended."
    #                 )
    #             elif "ladder" in item_name.lower():
    #                 recommendations.append(
    #                     f"🪜 {item_name}: Store horizontally on supports. "
    #                     f"Check for damage before each use."
    #                 )
    #             elif "hard hat" in item_name.lower() or "safety" in item_name.lower():
    #                 recommendations.append(
    #                     f"🛡️ {item_name}: Essential safety equipment. "
    #                     f"Replace if damaged or after impact."
    #                 )
    #             elif "paint" in item_name.lower():
    #                 recommendations.append(
    #                     f"🎨 {item_name}: Store in a cool, dry place. "
    #                     f"Stir well before use."
    #                 )
    #             elif "lumber" in item_name.lower() or "wood" in item_name.lower():
    #                 recommendations.append(
    #                     f"🪵 {item_name}: Store off the ground to prevent moisture damage."
    #                 )
    #             elif "concrete" in item_name.lower():
    #                 recommendations.append(
    #                     f"🧱 {item_name}: Keep dry and use within expiration date."
    #                 )
    #             elif "electrical" in item_name.lower() or "wire" in item_name.lower():
    #                 recommendations.append(
    #                     f"⚡ {item_name}: Ensure proper installation by licensed electrician."
    #                 )
    #             elif "plumbing" in item_name.lower() or "pipe" in item_name.lower():
    #                 recommendations.append(
    #                     f"🚰 {item_name}: Check for leaks and ensure proper connections."
    #                 )
    #             elif "steel" in item_name.lower():
    #                 recommendations.append(
    #                     f"🔩 {item_name}: Store in a dry, secure location. "
    #                     f"Consider a tool belt or toolbox for easy access."
    #                 )
    #             
    #             else:
    #                 recommendations.append(
    #                     f"📦 {item_name}: Store in appropriate conditions. "
    #                     f"Check manufacturer guidelines."
    #                 )
    #         
    #         return "\n\n".join(recommendations) if recommendations else "No specific recommendations available for the detected items."
    #         
    #     except Exception as e:
    #         logger.error(f"Error generating recommendations: {e}")
    #         return "Unable to generate recommendations."
    # --- END OLD LOGIC ---
    
    # For ALL detected objects, return a message indicating enhanced analysis is available
    # The detailed analysis will be provided by the LLM in the Q&A section
    detected_objects_list = ", ".join([f"{item} ({count})" for item, count in detected_items.items()])
    return f"Enhanced cost analysis available for detected items: {detected_objects_list}. Use the Q&A section below to get detailed labor costs, material breakdowns, and comprehensive estimates."

def format_currency(amount: float) -> str:
    """
    Format amount as currency string
    """
    return f"${amount:.2f}"

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage
    """
    import re
    # Remove or replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limit length
    if len(filename) > 100:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:95] + '.' + ext if ext else name[:100]
    return filename

def get_file_extension(filename: str) -> str:
    """
    Get file extension from filename
    """
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def is_valid_image_extension(extension: str) -> bool:
    """
    Check if file extension is a valid image format
    """
    valid_extensions = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'}
    return extension.lower() in valid_extensions 