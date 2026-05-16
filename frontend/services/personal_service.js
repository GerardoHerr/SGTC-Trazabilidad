import axios from 'axios';
import Config from '../constants/Config';

const BASE_URL = `${Config.API_URL}/personal`;

export const getPersonal = async (skip = 0, limit = 10, search = '') => {
    try {
        const params = { skip, limit };
        if (search) params.search = search;
        const response = await axios.get(`${BASE_URL}/`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching personal:', error);
        throw error;
    }
};

export const getPersonalById = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching trabajador:', error);
        throw error;
    }
};

export const createPersonal = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/`, data);
        return response.data;
    } catch (error) {
        console.error('Error creating trabajador:', error);
        throw error;
    }
};

export const updatePersonal = async (id, data) => {
    try {
        const response = await axios.put(`${BASE_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating trabajador:', error);
        throw error;
    }
};

export const deletePersonal = async (id) => {
    try {
        await axios.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error('Error deleting trabajador:', error);
        throw error;
    }
};
