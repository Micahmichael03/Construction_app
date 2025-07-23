#!/usr/bin/env python3
"""
Test script to debug Azure OpenAI client initialization
"""
import os
import time
from openai import AzureOpenAI

# Uncomment this part
# # Azure OpenAI Configuration - Direct API Key
# AZURE_API_KEY = ""
# AZURE_ENDPOINT = ""
# AZURE_DEPLOYMENT = ""

print(f"API Key: {'Present' if AZURE_API_KEY else 'Missing'}")
print(f"Endpoint: {AZURE_ENDPOINT}")
print(f"Deployment: {AZURE_DEPLOYMENT}")

# Check for proxies environment variable
proxies = os.getenv("HTTP_PROXY") or os.getenv("HTTPS_PROXY")
if proxies:
    print(f"WARNING: Proxies detected: {proxies}")

try:
    print("Attempting to create Azure OpenAI client...")
    client = AzureOpenAI(
        api_key=AZURE_API_KEY,
        azure_endpoint=AZURE_ENDPOINT,
        api_version="2024-12-01-preview"
    )
    print("✅ Azure OpenAI client created successfully!")
    
    # Test a simple call with timeout
    print("Testing client with a simple call...")
    try:
        response = client.chat.completions.create(
            model=AZURE_DEPLOYMENT,
            messages=[{"role": "user", "content": "Hello"}],
            max_completion_tokens=10
        )
        print("✅ Client test successful!")
        print(f"Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Error in test call: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
    
except Exception as e:
    print(f"❌ Error creating client: {e}")
    import traceback
    print(f"Full traceback: {traceback.format_exc()}") 