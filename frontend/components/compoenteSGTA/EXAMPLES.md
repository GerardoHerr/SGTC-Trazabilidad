/**
 * ========================================
 * COMPONENTES REUTILIZABLES
 * The Terroir Editorial Design System
 * ========================================
 *
 * Importa desde aquí todos los componentes listos para usar
 */

// ========================================
// 1. BUTTON (Botones variados)
// ========================================

import { Button } from '@/components';

// Primary Button
<Button 
  title="Seleccionar" 
  onPress={() => console.log('pressed')}
  variant="primary"
  size="medium"
/>

// Secondary Button
<Button 
  title="Acción Secundaria" 
  onPress={() => {}}
  variant="secondary"
/>

// Outlined Button
<Button 
  title="Cancelar" 
  onPress={() => {}}
  variant="outlined"
/>

// Tertiary Button
<Button 
  title="Acción Terciaria" 
  onPress={() => {}}
  variant="tertiary"
/>

// Full Width Button
<Button 
  title="Botón Grande" 
  onPress={() => {}}
  fullWidth
  size="large"
/>

// Disabled Button
<Button 
  title="Deshabilitado" 
  onPress={() => {}}
  disabled
/>

// ========================================
// 2. SEARCH BAR (Barra de búsqueda)
// ========================================

import { SearchBar } from '@/components';
import { useState } from 'react';

function MyComponent() {
  const [search, setSearch] = useState('');

  return (
    <SearchBar
      placeholder="Buscar lotes..."
      value={search}
      onChangeText={setSearch}
    />
  );
}

// ========================================
// 3. CARDS (Tarjetas/Recuadros)
// ========================================

import { Card, CardHeader, CardContent, CardFooter } from '@/components';
import { Text, View } from 'react-native';

// Elevated Card (con sombra)
<Card variant="elevated">
  <Text>Contenido de la tarjeta elevada</Text>
</Card>

// Filled Card (fondo tonal, sin sombra)
<Card variant="filled">
  <Text>Contenido de tarjeta rellena</Text>
</Card>

// Outlined Card (borde sutil)
<Card variant="outlined">
  <Text>Contenido de tarjeta con borde</Text>
</Card>

// Lot Card (diseño asimétrico para lotes)
<Card variant="lot">
  <Text>Información del lote</Text>
</Card>

// Card Completa (Header + Content + Footer)
<Card variant="elevated">
  <CardHeader title="Lote 7042" subtitle="Ubicación: Cordillera Central" />
  <CardContent>
    <Text>Elevación: 1,850m</Text>
  </CardContent>
  <CardFooter>
    <Button title="Seleccionar" onPress={() => {}} />
  </CardFooter>
</Card>

// ========================================
// EJEMPLO COMPLETO: Pantalla de Lotes
// ========================================

import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Button, SearchBar, Card } from '@/components';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LotesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [search, setSearch] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Inventario de Lotes
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Registro detallado de las unidades de producción activas
          </Text>
        </View>

        {/* Search Bar */}
        <SearchBar
          placeholder="Buscar por lote o ubicación..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
        />

        {/* Lote Cards */}
        <Card variant="elevated" style={styles.lotCard}>
          <View style={styles.lotHeader}>
            <View>
              <Text style={[styles.lotTitle, { color: colors.primary }]}>
                Lote 7042
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

        {/* More Cards */}
        <Card variant="filled" style={styles.lotCard}>
          <Text style={[styles.lotTitle, { color: colors.primary }]}>
            Lote 3012
          </Text>
          <Text style={[styles.lotSubtitle, { color: colors.onSurfaceVariant }]}>
            Ladera Norte - Geisha
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.displaySmall.fontSize,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '400',
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
