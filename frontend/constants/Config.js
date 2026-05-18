import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getApiUrl() {
    if (Platform.OS === 'web') {
        return 'http://localhost:8000';
    }
    // Expo Go en dispositivo físico: hostUri = "192.168.x.x:8081"
    const hostUri =
        Constants.expoConfig?.hostUri ??          // SDK 46+
        Constants.manifest2?.extra?.expoClient?.hostUri ?? // SDK 45
        Constants.manifest?.debuggerHost ??       // SDK <46
        '';
    const ip = hostUri.split(':')[0] || 'localhost';
    console.log('[Config] API_URL =>', `http://${ip}:8000`);
    return `http://${ip}:8000`;
}

const Config = {
    API_URL: getApiUrl(),
};

export default Config;
