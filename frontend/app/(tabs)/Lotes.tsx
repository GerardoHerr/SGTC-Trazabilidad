import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/compoenteSGTA/Card';
import { Button } from '@/components';

export default function LotesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header Section - Editorial hierarchy */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Gestión de Lotes
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Próximamente
        </Text>
      </View>

      {/* Content Card - Tonal layering (no borders) */}
      <Card variant="elevated" style={styles.lotCard}>
          <View style={styles.lotHeader}>
            <View>
              <Text style={[styles.lotTitle, { color: colors.primary }]}>
                Lote Ejemplo
              </Text>
              <Text style={[styles.lotSubtitle, { color: colors.onSurfaceVariant }]}>
                Cordillera Central, Sector Sur
              </Text>
            </View>
            <Text style={[styles.elevation, { color: colors.onSurfaceVariant }]}>
              1,850m
            </Text>
          </View>
          <Button 
            title="Seleccionar" 
            onPress={() => {}} 
            variant="primary"
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />
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
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 26,
  },

  searchBar: {
    marginBottom: Spacing.xl,
  },
  lotCard: {
    marginBottom: Spacing.lg,
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  lotTitle: {
    fontSize: Typography.headlineLarge.fontSize,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  lotSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '400',
  },
  elevation: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '500',
  },
});
