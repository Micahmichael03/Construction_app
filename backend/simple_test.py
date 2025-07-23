#!/usr/bin/env python3
"""
Simple test to isolate Azure OpenAI client issue
"""
import os
import sys

# Clear any proxy environment variables that might interfere
if 'HTTP_PROXY' in os.environ:
    del os.environ['HTTP_PROXY']
if 'HTTPS_PROXY' in os.environ:
    del os.environ['HTTPS_PROXY']

print("Testing Azure OpenAI client...")

try:
    from openai import AzureOpenAI
    
    #Uncomment this part
    # # Azure OpenAI Configuration
    # AZURE_API_KEY = "7mqqgtt8kGk1msrFDOureWrWSERYsnSoqu8MdV87qLMHrpaHlj07JQQJ99BFACHYHv6XJ3w3AAAAACOG682H"
    # AZURE_ENDPOINT = "https://realestateai.openai.azure.com/"
    # AZURE_DEPLOYMENT = "o4-mini"
    
    print(f"API Key: {'Present' if AZURE_API_KEY else 'Missing'}")
    print(f"Endpoint: {AZURE_ENDPOINT}")
    print(f"Deployment: {AZURE_DEPLOYMENT}")
    
    print("Creating Azure OpenAI client...")
    client = AzureOpenAI(
        api_key=AZURE_API_KEY,
        azure_endpoint=AZURE_ENDPOINT,
        api_version="2024-12-01-preview"
    )
    print("✅ Client created successfully!")
    
    print("Testing simple call...")
    response = client.chat.completions.create(
        model=AZURE_DEPLOYMENT,
        messages=[{"role": "user", "content": "Say hello"}],
        max_completion_tokens=10
    )
    print("✅ Test successful!")
    print(f"Response: {response.choices[0].message.content}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    print(f"Full traceback: {traceback.format_exc()}") 