import axios from 'axios';
import Config from '../constants/Config';

const BASE = Config.API_URL;

export const getAgricultores = async () => {
    const res = await axios.get(`${BASE}/personal/agricultores`);
    return res.data;
};

export const iniciarEtapa = async (loteId, semillaId, trabajadoresIds) => {
    const res = await axios.post(`${BASE}/lotes/${loteId}/iniciar-etapa`, {
        semilla_id: semillaId,
        trabajadores_ids: trabajadoresIds,
    });
    return res.data;
};

export const getFasesLote = async (loteId) => {
    const res = await axios.get(`${BASE}/lotes/${loteId}/fases`);
    return res.data;
};
