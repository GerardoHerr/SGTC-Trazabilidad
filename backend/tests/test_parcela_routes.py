import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_listar_parcelas():
    response = client.get("/parcelas")
    assert response.status_code == 200
    assert "total" in response.json()
    assert "parcelas" in response.json()


def test_obtener_parcela():
    response = client.get("/parcelas/1")
    assert response.status_code in [200, 404]