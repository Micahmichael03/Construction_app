import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

#Uncomment this part
# # Get Azure OpenAI credentials from environment variables with fallbacks
# api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
# endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "https://realestateai.openai.azure.com/")
# deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "o4-mini")

# Legacy variable for backward compatibility
api_key1 = api_key
