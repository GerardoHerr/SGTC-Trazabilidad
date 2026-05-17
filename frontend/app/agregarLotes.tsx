import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card } from '@/components';
import { getParcelaById as obtenerParcela } from '@/services/parcela_service';
import { crearLotes, listarLotes } from '@/services/lote_service';
import { getSemillas } from '@/services/semilla_service';

const AgregarLotes = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { parcelaId } = useLocalSearchParams();

  const [parcela, setParcela] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cantidadLotes, setCantidadLotes] = useState('1');
  const [distribuciones, setDistribuciones] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [semillas, setSemillas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [hectareasUsadas, setHectareasUsadas] = useState(0);
  const [validacionMsg, setValidacionMsg] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar parcela
      const dataParcela = await obtenerParcela(parcelaId);
      setParcela(dataParcela);

      // Cargar lotes existentes para calcular hectáreas usadas
      const lotesExistentes = await listarLotes(parcelaId);
      const usadas = lotesExistentes.reduce((sum, lote) => sum + (lote.hectareas_asignadas || 0), 0);
      setHectareasUsadas(usadas);

      // Cargar semillas
      const dataSemillas = await getSemillas();
      setSemillas(dataSemillas);

      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos');
      setLoading(false);
    }
  };

  const calcularDistribucion = (cantidad) => {
    if (!parcela || cantidad < 1) {
      setDistribuciones([]);
      return;
    }

    const hectareasPromedio = parcela.hectareas / cantidad;
    const nuevasDistribuciones = Array.from({ length: cantidad }, (_, i) => ({
      numero_lote: i + 1,
      hectareas: Math.round((hectareasPromedio + Number.EPSILON) * 100) / 100,
      tipo_zona: null,
    }));

    setDistribuciones(nuevasDistribuciones);
  };

  const handleCantidadChange = (text) => {
    const num = parseInt(text) || 0;
    setCantidadLotes(text);
    if (num > 0) {
      calcularDistribucion(num);
    }
  };

  const handleHectareasChange = (index, valor) => {
    const nuevas = [...distribuciones];
    nuevas[index].hectareas = parseFloat(valor) || 0;
    setDistribuciones(nuevas);
  };

  const handleTipoZonaChange = (index, tipoZona) => {
    const nuevas = [...distribuciones];
    nuevas[index].tipo_zona = tipoZona;
    setDistribuciones(nuevas);
  };

  const validarDistribucion = () => {
    setValidacionMsg('');
    
    // Validar que cantidad sea > 0
    const cantidad = parseInt(cantidadLotes);
    if (cantidad < 1) {
      setError('La cantidad de lotes debe ser mayor a 0');
      return false;
    }

    if (distribuciones.length !== cantidad) {
      setError('Error en la cantidad de distribuciones');
      return false;
    }

    // Validar suma de hectáreas
    const totalHectareas = distribuciones.reduce((sum, d) => sum + d.hectareas, 0);
    const hectareasDisponibles = parcela.hectareas - hectareasUsadas;
    
    if (totalHectareas > hectareasDisponibles) {
      setError(
        `La suma de hectáreas (${totalHectareas}) no puede exceder el espacio disponible (${hectareasDisponibles.toFixed(2)} ha)`
      );
      return false;
    }

    // Para parcelas irregulares, validar tipo_zona
    if (parcela.tipo_terreno === 'Irregular') {
      for (let i = 0; i < distribuciones.length; i++) {
        if (!distribuciones[i].tipo_zona) {
          setError(`Debe especificar el tipo de zona para el lote ${i + 1}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleGuardar = async () => {
    setError('');
    setSuccess('');

    if (!validarDistribucion()) {
      return;
    }

    setSaving(true);
    try {
      const lotesData = {
        parcela_id: parseInt(parcelaId),
        cantidad_lotes: parseInt(cantidadLotes),
        distribuciones: distribuciones,
      };

      await crearLotes(lotesData);
      setSuccess('✓ Lotes creados exitosamente');
      setTimeout(() => {
        router.push({
          pathname: '/ListarLotes' as any,
          params: { parcelaId },
        });
      }, 1500);
    } catch (err) {
      const mensaje =
        err.response?.data?.detail || 'Error al crear los lotes';
      setError(mensaje);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!parcela) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText type="subtitle">Parcela no encontrada</ThemedText>
      </ThemedView>
    );
  }

  const tiposZona = ['Zona Plana', 'Zona Inclinada', 'Zona Baja', 'Zona Alta'];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      <ThemedView style={{ marginBottom: 24 }}>
        <ThemedText type="title" style={{ marginBottom: 8 }}>
          Crear Lotes
        </ThemedText>
        <ThemedText type="subtitle">
          Parcela {parcela.codigo} ({parcela.hectareas} hectáreas)
        </ThemedText>
        {hectareasUsadas > 0 && (
          <ThemedText style={{ marginTop: 4, fontSize: 12, color: colors.textSecondary }}>
            Disponibles: {(parcela.hectareas - hectareasUsadas).toFixed(2)} ha ({hectareasUsadas.toFixed(2)} ha ya usadas)
          </ThemedText>
        )}
      </ThemedView>

      {/* Cantidad de Lotes */}
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <MaterialCommunityIcons name="numeric" size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <ThemedText type="subtitle">Cantidad de Lotes</ThemedText>
        </View>
        <TextInput
          placeholder="Ej: 3"
          keyboardType="numeric"
          value={cantidadLotes}
          onChangeText={handleCantidadChange}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            color: colors.text,
            backgroundColor: colors.surfaceContainerLow,
          }}
          placeholderTextColor={colors.textSecondary}
        />
      </Card>

      {/* Información de tipo de parcela */}
      {parcela.tipo_terreno && (
        <Card
          style={{
            marginBottom: 16,
            backgroundColor: colors.surfaceContainerLow,
          }}
        >
          <ThemedText type="subtitle">
            Tipo de Terreno: {parcela.tipo_terreno}
          </ThemedText>
          {parcela.tipo_terreno === 'Irregular' && (
            <ThemedText style={{ color: colors.textSecondary, marginTop: 4 }}>
              ℹ Deberá seleccionar el tipo de zona para cada lote
            </ThemedText>
          )}
        </Card>
      )}

      {/* Distribución de Lotes */}
      {distribuciones.length > 0 && (
        <ThemedView>
          <ThemedText
            type="subtitle"
            style={{ marginBottom: 12, marginTop: 8 }}
          >
            Distribución de Hectáreas
          </ThemedText>

          {distribuciones.map((dist, index) => (
            <Card key={index} style={{ marginBottom: 12 }}>
              <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
                Lote {dist.numero_lote}
              </ThemedText>

              {/* Hectáreas */}
              <ThemedText style={{ marginBottom: 4, fontSize: 12 }}>
                Hectáreas
              </ThemedText>
              <TextInput
                placeholder="Hectáreas"
                keyboardType="decimal-pad"
                value={dist.hectareas.toString()}
                onChangeText={(val) => handleHectareasChange(index, val)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 16,
                  color: colors.text,
                  backgroundColor: colors.surfaceContainerLow,
                  marginBottom: 12,
                }}
                placeholderTextColor={colors.textSecondary}
              />

              {/* Tipo de Zona (solo para irregulares) */}
              {parcela.tipo_terreno === 'Irregular' && (
                <View>
                  <ThemedText style={{ marginBottom: 8, fontSize: 12 }}>
                    Tipo de Zona
                  </ThemedText>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {tiposZona.map((tipo) => (
                      <TouchableOpacity
                        key={tipo}
                        onPress={() =>
                          handleTipoZonaChange(
                            index,
                            dist.tipo_zona === tipo ? null : tipo
                          )
                        }
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor:
                            dist.tipo_zona === tipo
                              ? colors.primary
                              : colors.surfaceContainerLow,
                          borderWidth: 1,
                          borderColor:
                            dist.tipo_zona === tipo
                              ? colors.primary
                              : colors.border,
                        }}
                      >
                        <ThemedText
                          style={{
                            fontSize: 12,
                            color:
                              dist.tipo_zona === tipo
                                ? '#fff'
                                : colors.text,
                          }}
                        >
                          {tipo.split(' ')[1]}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          ))}

          {/* Resumen */}
          <Card
            style={{
              marginBottom: 16,
              backgroundColor: colors.surfaceContainer,
              marginTop: 16,
            }}
          >
            <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
              Resumen
            </ThemedText>
            <ThemedText>
              Hectáreas totales de parcela: {parcela.hectareas}
            </ThemedText>
            <ThemedText style={{ marginTop: 4 }}>
              Hectáreas ya usadas: {hectareasUsadas.toFixed(2)}
            </ThemedText>
            <ThemedText style={{ marginTop: 4, marginBottom: 8 }}>
              Hectáreas disponibles:{' '}
              {(parcela.hectareas - hectareasUsadas).toFixed(2)}
            </ThemedText>
            
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 }}>
              <ThemedText style={{ marginTop: 4 }}>
                Nuevas hectáreas a asignar:{' '}
                {distribuciones.reduce((sum, d) => sum + d.hectareas, 0).toFixed(2)}
              </ThemedText>
              <ThemedText style={{ marginTop: 4 }}>
                Hectáreas después de crear:{' '}
                {(
                  parcela.hectareas -
                  hectareasUsadas -
                  distribuciones.reduce((sum, d) => sum + d.hectareas, 0)
                ).toFixed(2)}
              </ThemedText>

              {distribuciones.length > 0 && (
                parcela.hectareas - hectareasUsadas - distribuciones.reduce((sum, d) => sum + d.hectareas, 0) < 0 ? (
                  <View style={{ marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.error + '20', borderRadius: 8, borderWidth: 1, borderColor: colors.error }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <MaterialCommunityIcons name="alert" size={18} color={colors.error} style={{ marginRight: 8, marginTop: 2 }} />
                      <ThemedText style={{ color: colors.error, flex: 1 }}>
                        ⚠ Excedes el espacio disponible por {Math.abs(parcela.hectareas - hectareasUsadas - distribuciones.reduce((sum, d) => sum + d.hectareas, 0)).toFixed(2)} ha
                      </ThemedText>
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.success + '20', borderRadius: 8, borderWidth: 1, borderColor: colors.success }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} style={{ marginRight: 8 }} />
                      <ThemedText style={{ color: colors.success, flex: 1 }}>
                        ✓ Distribución válida
                      </ThemedText>
                    </View>
                  </View>
                )
              )}
            </View>
          </Card>
        </ThemedView>
      )}

      {/* Botones */}
      {error && (
        <Card
          style={{
            marginBottom: 16,
            backgroundColor: colors.error + '20',
            borderColor: colors.error,
            borderWidth: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color={colors.error}
              style={{ marginRight: 8 }}
            />
            <ThemedText style={{ color: colors.error, flex: 1 }}>
              {error}
            </ThemedText>
          </View>
        </Card>
      )}

      {success && (
        <Card
          style={{
            marginBottom: 16,
            backgroundColor: colors.success + '20',
            borderColor: colors.success,
            borderWidth: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={colors.success}
              style={{ marginRight: 8 }}
            />
            <ThemedText style={{ color: colors.success }}>
              {success}
            </ThemedText>
          </View>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <Button
          title="Cancelar"
          onPress={() => router.back()}
          variant="outlined"
          style={{ flex: 1 }}
        />
        <Button
          title="Guardar"
          onPress={handleGuardar}
          loading={saving}
          disabled={distribuciones.length === 0 || saving}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
};

export default AgregarLotes;
