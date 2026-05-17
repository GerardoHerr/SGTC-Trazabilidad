import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="agregarSemilla" options={{ headerShown: true, title: 'Agregar Semilla' }} />
        <Stack.Screen name="Listarsemilla" options={{ headerShown: true, title: 'Listar Semillas' }} />
        <Stack.Screen 
          name="parcela/[id]" 
          options={{ 
            headerShown: true,
            title: 'Detalle de Parcela'
          }} 
        />
        <Stack.Screen 
          name="parcela/agregar" 
          options={{ 
            headerShown: true,
            title: 'Agregar Parcela'
          }} 
        />
        <Stack.Screen 
          name="personal/[id]" 
          options={{ 
            headerShown: true,
            title: 'Detalle de Personal'
          }} 
        />
        <Stack.Screen
          name="semilla/[id]"
          options={{
            headerShown: true,
            title: 'Detalle de Semilla'
          }}
        />

        <Stack.Screen 
          name="personal/agregar" 
          options={{ 
            headerShown: true,
            title: 'Agregar Personal'
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
