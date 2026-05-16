import axios from 'axios';
import Config from '../constants/Config';

const BASE_URL = `${Config.API_URL}/parcelas`;

export const getParcelas = async (skip = 0, limit = 10, search = '', estado = '') => {
    try {
        const params = { skip, limit };
        if (search) params.search = search;
        if (estado) params.estado = estado;
        const response = await axios.get(`${BASE_URL}/`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching parcelas:', error);
        throw error;
    }
};

export const getParcelaById = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching parcela:', error);
        throw error;
    }
};

export const createParcela = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/`, data);
        return response.data;
    } catch (error) {
        console.error('Error creating parcela:', error);
        throw error;
    }
};

export const updateParcela = async (id, data) => {
    try {
        const response = await axios.put(`${BASE_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating parcela:', error);
        throw error;
    }
};

export const deleteParcela = async (id) => {
    try {
        await axios.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error('Error deleting parcela:', error);
        throw error;
    }
};
