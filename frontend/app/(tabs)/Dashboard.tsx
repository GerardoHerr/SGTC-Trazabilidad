import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handlePress = (buttonName: string) => {
    console.log(`Botón presionado: ${buttonName}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header - Editorial asymmetry with generous spacing */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Bienvenido
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Selecciona una opción para comenzar
        </Text>
      </View>

      {/* Botones principales - Organic Brutalism with tonal layering */}
        <Button 
            title="Semillas" 
            onPress={() => router.push('/Listarsemilla')}
            variant="secondary"
            size="small"
            style={{ marginTop: Spacing.lg }}
        />
        <Button
            title="Personal"
            onPress={() => router.push('/Personal' as any)}
            variant="primary"
            size="small"
            style={{ marginTop: Spacing.lg }}
        />

        <Button
            title="Parcelas"
            onPress={() => router.push('/Parcelas' as any)}
            variant="tertiary"
            size="small"
            style={{ marginTop: Spacing.lg }}
        />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 48, // 32dp+ vertical spacing per design system
  },

  tamanioButton: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24, // Generous spacing between buttons
  },
  button: {
    borderRadius: 24, // xl (1.5rem) roundedness for pebble-like feel
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // Ambient Shadow: natural light on matte surface
    elevation: 3,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 28,
  },
  buttonSemillas: {
    // Asymmetrical layout - editorial style
    paddingLeft: 28,
  },
  buttonPersonal: {
    // Intentional asymmetry
    marginLeft: 8,
  },
  buttonLotes: {
    // Continued asymmetry
    marginRight: 8,
  },
  buttonEmoji: {
    fontSize: 56,
    marginBottom: 16,
    lineHeight: 64,
  },
  buttonLabel: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
});
