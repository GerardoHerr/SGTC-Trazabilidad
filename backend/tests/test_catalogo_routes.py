import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_listar_opciones():
    response = client.get("/catalogos/test_categoria")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_agregar_opcion():
    data = {"valor": "opcion_test"}
    response = client.post("/catalogos/test_categoria", json=data)
    assert response.status_code == 201
    assert isinstance(response.json(), list)