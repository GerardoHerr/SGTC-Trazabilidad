import axios from 'axios';
import Config from '../constants/Config';

const API_URL = Config.API_URL;

// Crear múltiples lotes
export const crearLotes = async (lotesData) => {
  try {
    const response = await axios.post(`${API_URL}/lotes`, lotesData);
    return response.data;
  } catch (error) {
    console.error('Error al crear lotes:', error);
    throw error;
  }
};

// Listar lotes con filtros opcionales
export const listarLotes = async (parcelaId = null, estado = null) => {
  try {
    let url = `${API_URL}/lotes`;
    const params = [];
    
    if (parcelaId) params.push(`parcela_id=${parcelaId}`);
    if (estado) params.push(`estado=${estado}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al listar lotes:', error);
    throw error;
  }
};

// Obtener un lote específico
export const obtenerLote = async (loteId) => {
  try {
    const response = await axios.get(`${API_URL}/lotes/${loteId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener lote:', error);
    throw error;
  }
};

// Actualizar un lote (asignar semilla y/o cambiar estado)
export const actualizarLote = async (loteId, loteData) => {
  try {
    const response = await axios.put(`${API_URL}/lotes/${loteId}`, loteData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar lote:', error);
    throw error;
  }
};

// Eliminar un lote
export const eliminarLote = async (loteId) => {
  try {
    const response = await axios.delete(`${API_URL}/lotes/${loteId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar lote:', error);
    throw error;
  }
};
