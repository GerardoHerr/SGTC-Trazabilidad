import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, SearchBar } from '@/components';
import { listarLotes } from '@/services/lote_service';
import { getParcelaById as obtenerParcela } from '@/services/parcela_service';

const ListarLotes = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { parcelaId } = useLocalSearchParams();

  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [parcela, setParcela] = useState(null);
  const [error, setError] = useState('');

  // Cargar datos al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [parcelaId])
  );

  const cargarDatos = async () => {
    try {
      setError('');
      
      // Cargar parcela si se proporciona ID
      if (parcelaId) {
        const dataParcela = await obtenerParcela(parcelaId);
        setParcela(dataParcela);
        
        // Cargar lotes de esa parcela
        const dataLotes = await listarLotes(parseInt(parcelaId));
        setLotes(dataLotes);
      } else {
        // Cargar todos los lotes activos
        const dataLotes = await listarLotes();
        setLotes(dataLotes);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los lotes');
      console.error(err);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Creado':
        return colors.warning;
      case 'En Proceso':
        return colors.success;
      case 'Completado':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'Creado':
        return 'clock-outline';
      case 'En Proceso':
        return 'progress-check';
      case 'Completado':
        return 'check-circle';
      default:
        return 'information';
    }
  };

  // Filtrar lotes por búsqueda
  const lotesFiltrados = lotes.filter(
    (lote) =>
      lote.codigo.toLowerCase().includes(searchText.toLowerCase()) ||
      (lote.tipo_zona && lote.tipo_zona.toLowerCase().includes(searchText.toLowerCase()))
  );

  const handleAgregarLotes = () => {
    if (!parcelaId) {
      Alert.alert('Error', 'Debe seleccionar una parcela primero');
      return;
    }
    router.push({
      pathname: '/agregarLotes' as any,
      params: { parcelaId },
    });
  };

  const handleVerDetalle = (lote) => {
    router.push({
      pathname: '/lote/[id]' as any,
      params: { id: lote.id, parcelaId },
    });
  };

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.surfaceContainer,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <ThemedText type="title">Inventario de Lotes</ThemedText>
            <ThemedText type="subtitle" style={{ marginTop: 2 }}>
              {parcela ? `Parcela ${parcela.codigo}` : 'Todos los lotes'}
            </ThemedText>
          </View>
          <Button
            title="Agregar"
            onPress={handleAgregarLotes}
            icon="plus"
            size="sm"
          />
        </View>

        {/* Búsqueda */}
        <SearchBar
          placeholder="Buscar lotes..."
          value={searchText}
          onChangeText={setSearchText}
          icon="magnify"
        />

        {/* Contador */}
        <ThemedText style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
          {lotesFiltrados.length} de {lotes.length} lotes
        </ThemedText>
      </View>

      {/* Mensajes de error */}
      {error && (
        <Card style={{ margin: 16, backgroundColor: colors.error + '20' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color={colors.error}
              style={{ marginRight: 8 }}
            />
            <ThemedText style={{ color: colors.error }}>
              {error}
            </ThemedText>
          </View>
        </Card>
      )}

      {/* Lista de Lotes */}
      {lotesFiltrados.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <MaterialCommunityIcons
            name="inbox-multiple-outline"
            size={48}
            color={colors.textSecondary}
            style={{ marginBottom: 16 }}
          />
          <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
            {lotes.length === 0
              ? 'No hay lotes registrados'
              : 'No se encontraron resultados'}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={lotesFiltrados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item: lote }) => (
            <Card
              style={{
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: getEstadoColor(lote.estado),
              }}
            >
              {/* Header del lote */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={{ fontSize: 16 }}>
                    Lote {lote.codigo}
                  </ThemedText>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 6,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={getEstadoIcon(lote.estado)}
                      size={16}
                      color={getEstadoColor(lote.estado)}
                      style={{ marginRight: 6 }}
                    />
                    <ThemedText
                      style={{
                        color: getEstadoColor(lote.estado),
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {lote.estado}
                    </ThemedText>
                  </View>
                </View>

                {/* Badge de hectáreas */}
                <View
                  style={{
                    backgroundColor: colors.surfaceContainerLow,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <ThemedText style={{ fontSize: 12, fontWeight: '600' }}>
                    {lote.hectareas_asignadas} ha
                  </ThemedText>
                </View>
              </View>

              {/* Información del lote */}
              <View
                style={{
                  backgroundColor: colors.surfaceContainerLow,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                {lote.tipo_zona && (
                  <View style={{ marginBottom: 8 }}>
                    <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                      Tipo de Zona
                    </ThemedText>
                    <ThemedText style={{ fontWeight: '500' }}>
                      {lote.tipo_zona}
                    </ThemedText>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                      Fecha de Creación
                    </ThemedText>
                    <ThemedText style={{ fontWeight: '500' }}>
                      {new Date(lote.fecha_creacion).toLocaleDateString()}
                    </ThemedText>
                  </View>

                  {lote.semilla_id && (
                    <View>
                      <ThemedText
                        style={{ fontSize: 12, color: colors.textSecondary }}
                      >
                        Semilla Asignada
                      </ThemedText>
                      <ThemedText style={{ fontWeight: '500', color: colors.success }}>
                        ✓ Sí
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>

              {/* Indicador de progreso (simulado) */}
              {lote.estado === 'En Proceso' && (
                <View style={{ marginBottom: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <ThemedText style={{ fontSize: 12 }}>
                      Progreso General
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, fontWeight: '600' }}>
                      50%
                    </ThemedText>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.surfaceContainerLow,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: '50%',
                        backgroundColor: colors.success,
                      }}
                    />
                  </View>
                </View>
              )}

              {/* Botones de acción */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  title="Ver Detalles"
                  onPress={() => handleVerDetalle(lote)}
                  variant="outlined"
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}
        />
      )}
    </ThemedView>
  );
};

export default ListarLotes;
