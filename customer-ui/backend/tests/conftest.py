import pytest
import os
import httpx
from server import app

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001")

@pytest.fixture
def client():
    with httpx.Client(base_url=f"{BACKEND_URL}/api", timeout=10.0) as c:
        yield c

@pytest.fixture
async def aclient():
    async with httpx.AsyncClient(base_url=f"{BACKEND_URL}/api", timeout=10.0) as ac:
        yield ac

def api_url(path: str) -> str:
    clean = path.lstrip("/")
    return f"{BACKEND_URL}/api/{clean}"
