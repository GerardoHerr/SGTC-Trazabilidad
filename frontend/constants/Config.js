import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getApiUrl() {
    if (Platform.OS === 'web') {
        return 'http://localhost:8000';
    }
    // En dispositivo físico (Expo Go via QR), el hostUri contiene la IP de la máquina de desarrollo
    const hostUri = Constants.expoConfig?.hostUri ?? '';
    const ip = hostUri.split(':')[0] || 'localhost';
    return `http://${ip}:8000`;
}

const Config = {
    API_URL: getApiUrl(),
};

export default Config;