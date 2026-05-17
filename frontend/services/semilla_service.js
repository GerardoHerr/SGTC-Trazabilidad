import axios from "axios"; 
import Config from "../constants/Config";

export const getSemillas = async () => {
    try {
        const response = await axios.get(`${Config.API_URL}/semillas`);
        return response.data;
    } catch (error) {
        console.error("Error fetching semillas:", error);
        throw error;
    }
};

export const createSemilla = async (semillaData, anexo) => {
    try {
        const formData = new FormData();
        
        // Agregar datos de semilla directamente
        formData.append('variedad', semillaData.variedad || '');
        formData.append('origen', semillaData.origen || '');
        formData.append('metodo_secado', semillaData.metodo_secado || '');
        formData.append('seleccion', semillaData.seleccion || '');
        formData.append('olor', semillaData.olor || '');
        formData.append('color', semillaData.color || '');
        formData.append('integridad_pergamino', semillaData.integridad_pergamino || '');
        
        // Agregar archivo si existe
        if (anexo) {
            // En Expo web, el uri es una ruta local que necesita convertirse a Blob
            try {
                const response = await fetch(anexo.uri);
                const blob = await response.blob();
                formData.append('anexo', blob, anexo.name);
            } catch (err) {
                console.warn('No se pudo obtener el archivo, intentando agregar directamente:', err);
                // Fallback: intentar agregar directamente
                formData.append('anexo', {
                    uri: anexo.uri,
                    type: anexo.mimeType || 'application/octet-stream',
                    name: anexo.name,
                });
            }
        }
        
        // POST sin especificar Content-Type
        // Axios detectará FormData y configurará multipart/form-data con boundary automáticamente
        const response = await axios.post(`${Config.API_URL}/semillas`, formData);
        return response.data;
    } catch (error) {
        console.error("Error creating semilla:", error);
        throw error;
    }
};
