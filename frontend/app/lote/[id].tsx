import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card } from '@/components';
import { obtenerLote, actualizarLote } from '@/services/lote_service';
import { getSemillas } from '@/services/semilla_service';
import { getParcelaById } from '@/services/parcela_service';

const DetalleLote = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id, parcelaId } = useLocalSearchParams();

  const [lote, setLote] = useState(null);
  const [parcela, setParcela] = useState(null);
  const [semillas, setSemillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [asignandoSemilla, setAsignandoSemilla] = useState(false);
  const [mostrarSemillas, setMostrarSemillas] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar lote
      const dataLote = await obtenerLote(parseInt(id));
      setLote(dataLote);

      // Cargar parcela
      if (parcelaId) {
        const dataParcela = await getParcelaById(parseInt(parcelaId));
        setParcela(dataParcela);
      }

      // Cargar semillas
      const dataSemillas = await getSemillas();
      setSemillas(dataSemillas);

      setLoading(false);
    } catch (err) {
      Alert.alert('Error', 'Error al cargar los datos');
      setLoading(false);
    }
  };

  const handleAsignarSemilla = async (semillaId) => {
    setAsignandoSemilla(true);
    try {
      const loteActualizado = await actualizarLote(parseInt(id), {
        semilla_id: semillaId,
      });
      setLote(loteActualizado);
      setMostrarSemillas(false);
      Alert.alert('Éxito', 'Semilla asignada correctamente');
    } catch (err) {
      Alert.alert('Error', 'Error al asignar la semilla');
    } finally {
      setAsignandoSemilla(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!lote) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Lote no encontrado</ThemedText>
      </ThemedView>
    );
  }

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        {/* Header */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ marginBottom: 12 }}>
            <ThemedText type="title">Lote {lote.codigo}</ThemedText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={getEstadoColor(lote.estado)}
                style={{ marginRight: 8 }}
              />
              <ThemedText
                style={{
                  color: getEstadoColor(lote.estado),
                  fontWeight: '600',
                }}
              >
                {lote.estado}
              </ThemedText>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.surfaceContainerLow,
              padding: 12,
              borderRadius: 8,
            }}
          >
            <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
              Número de Lote
            </ThemedText>
            <ThemedText style={{ fontWeight: '600', fontSize: 16 }}>
              {lote.numero_lote}
            </ThemedText>
          </View>
        </Card>

        {/* Información de la parcela */}
        {parcela && (
          <Card style={{ marginBottom: 16 }}>
            <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
              Parcela Asociada
            </ThemedText>
            <View
              style={{
                backgroundColor: colors.surfaceContainerLow,
                padding: 12,
                borderRadius: 8,
              }}
            >
              <View style={{ marginBottom: 8 }}>
                <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                  Código
                </ThemedText>
                <ThemedText style={{ fontWeight: '600' }}>
                  {parcela.codigo}
                </ThemedText>
              </View>
              <View>
                <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                  Tipo de Terreno
                </ThemedText>
                <ThemedText style={{ fontWeight: '600' }}>
                  {parcela.tipo_terreno}
                </ThemedText>
              </View>
            </View>
          </Card>
        )}

        {/* Características del lote */}
        <Card style={{ marginBottom: 16 }}>
          <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
            Características
          </ThemedText>

          <View style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <ThemedText style={{ color: colors.textSecondary }}>
                Hectáreas Asignadas
              </ThemedText>
              <ThemedText style={{ fontWeight: '600' }}>
                {lote.hectareas_asignadas} ha
              </ThemedText>
            </View>

            {lote.tipo_zona && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <ThemedText style={{ color: colors.textSecondary }}>
                  Tipo de Zona
                </ThemedText>
                <ThemedText style={{ fontWeight: '600' }}>
                  {lote.tipo_zona}
                </ThemedText>
              </View>
            )}

            <View>
              <ThemedText style={{ color: colors.textSecondary }}>
                Fecha de Creación
              </ThemedText>
              <ThemedText style={{ fontWeight: '600' }}>
                {new Date(lote.fecha_creacion).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Semilla Asignada */}
        <Card style={{ marginBottom: 16 }}>
          <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
            Semilla
          </ThemedText>

          {lote.semilla_id ? (
            <View
              style={{
                backgroundColor: colors.success + '20',
                padding: 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={colors.success}
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: colors.success, fontWeight: '600' }}>
                  Semilla Asignada
                </ThemedText>
                <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                  ID: {lote.semilla_id}
                </ThemedText>
              </View>
            </View>
          ) : (
            <View>
              <View
                style={{
                  backgroundColor: colors.warning + '20',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name="alert"
                  size={20}
                  color={colors.warning}
                  style={{ marginRight: 8 }}
                />
                <ThemedText style={{ color: colors.warning, fontWeight: '600' }}>
                  Sin semilla asignada
                </ThemedText>
              </View>

              {lote.estado === 'Creado' && (
                <Button
                  title={
                    mostrarSemillas
                      ? 'Ocultar Semillas'
                      : 'Asignar Semilla'
                  }
                  onPress={() => setMostrarSemillas(!mostrarSemillas)}
                  variant={mostrarSemillas ? 'outline' : 'primary'}
                />
              )}
            </View>
          )}
        </Card>

        {/* Listado de Semillas para Asignar */}
        {mostrarSemillas && (
          <Card style={{ marginBottom: 16 }}>
            <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
              Seleccionar Semilla
            </ThemedText>

            {semillas.length === 0 ? (
              <ThemedText style={{ color: colors.textSecondary }}>
                No hay semillas disponibles
              </ThemedText>
            ) : (
              <FlatList
                scrollEnabled={false}
                data={semillas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item: semilla }) => (
                  <TouchableOpacity
                    onPress={() => handleAsignarSemilla(semilla.id)}
                    disabled={asignandoSemilla}
                  >
                    <View
                      style={{
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        backgroundColor: colors.surfaceContainerLow,
                      }}
                    >
                      <ThemedText style={{ fontWeight: '600' }}>
                        {semilla.variedad}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                        Origen: {semilla.origen || 'N/A'}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </Card>
        )}

        {/* Botones de acción */}
        <View style={{ gap: 8, marginBottom: 24 }}>
          <Button
            title="Volver"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default DetalleLote;
