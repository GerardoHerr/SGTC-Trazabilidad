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

export const createSemilla = async (semillaData) => {
    try {
        const response = await axios.post(`${Config.API_URL}/semillas`, semillaData);
        return response.data;
    }
    catch (error) {
        console.error("Error creating semilla:", error);
        throw error;
    }
};
