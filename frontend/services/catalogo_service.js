import axios from 'axios';
import Config from '../constants/Config';

const BASE_URL = `${Config.API_URL}/catalogos`;

export const getOpciones = async (categoria) => {
    const response = await axios.get(`${BASE_URL}/${categoria}`);
    return response.data; // string[]
};

export const addOpcion = async (categoria, valor) => {
    const response = await axios.post(`${BASE_URL}/${categoria}`, { valor });
    return response.data; // string[] opciones actualizadas
};
