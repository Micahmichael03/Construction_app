from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from typing import Optional

#Uncomment this part
# # API Key for security validation
# API_KEY = ""

security = HTTPBearer()

def get_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Validate API key from Bearer token
    """
    # Use hardcoded key for now
    api_key = API_KEY
    if credentials.credentials != api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials

def validate_api_key(api_key: str) -> bool:
    """
    Validate API key without raising exception
    """
    expected_key = API_KEY
    return api_key == expected_key

def get_optional_api_key(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """
    Get API key if provided, but don't require it
    """
    if not credentials:
        return None
    api_key = API_KEY
    if credentials.credentials != api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials 