import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_iniciar_etapa():
    data = {"semilla_id": 1, "trabajadores_ids": [1, 2]}
    response = client.post("/lotes/1/iniciar-etapa", json=data)
    assert response.status_code in [201, 404, 400]