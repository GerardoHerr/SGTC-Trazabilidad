import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/compoenteSGTA/Card';

export default function ConfiguracionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header Section - Editorial hierarchy */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Configuración
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Próximamente
        </Text>
      </View>

      {/* Content Card - Tonal layering (no borders) */}
      <Card variant="elevated" style={styles.contentCard}>
        <Text style={[styles.cardText, { color: colors.primary }]}>
          Las opciones de configuración estarán disponibles próximamente.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 48,
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
  contentCard: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginTop: 24,
  },
  cardText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '400',
    lineHeight: 26,
  },
});
