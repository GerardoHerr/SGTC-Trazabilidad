import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_crear_semilla():
    data = {
        "variedad": "test_variedad",
        "origen": "test_origen",
        "distribuidor": "test_distribuidor"
    }
    response = client.post("/semillas", data=data)
    assert response.status_code in [200, 400]