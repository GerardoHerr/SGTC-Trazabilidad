import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card, Button } from '@/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createSemilla } from '@/services/semilla_service';

// Enums con opciones
const VARIEDADES = [
  'Caturra',
  'Castillo',
  'Geisha',
  'Bourbon',
  'Típica'
];

const METODOS_SECADO = [
  'Secado en marquesinas del sol',
  'Secado lento a la sombra sobre camas africanas'
];

const METODOS_SELECCION = [
  'Clasificación manual grano a grano',
  'Flotación en agua y cribado mecánico por tamaño'
];

const OLORES = [
  'Fresco',
  'A hierba seca',
  'A paja limpia',
  'A moho',
  'A fermento'
];

const COLORES_PERGAMINO = [
  'Amarillo pálido uniforme',
  'Crema claro',
  'Marfil'
];

const INTEGRIDADS = [
  '98% de granos con pergamino intacto',
  'Sin fisuras ni descascarillado visible'
];

interface FormState {
  variedad: string;
  origen: string;
  metodo_secado: string;
  seleccion: string;
  olor: string;
  color: string;
  integridad_pergamino: string;
}

interface PickerFieldProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  colors: any;
  icon: string;
}

const PickerField = ({ label, value, options, onSelect, colors, icon }: PickerFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.pickerButton, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <MaterialCommunityIcons name={icon as any} size={18} color={colors.secondary} />
        <Text style={[styles.pickerButtonText, { color: value ? colors.onSurface : colors.onSurfaceVariant }]}>
          {value || `Seleccionar ${label.toLowerCase()}`}
        </Text>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {isOpen && (
        <Card variant="filled" style={styles.dropdownContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.dropdownItem,
                value === option && { backgroundColor: colors.primaryContainer }
              ]}
              onPress={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  {
                    color: value === option ? colors.onPrimaryContainer : colors.onSurface
                  }
                ]}
              >
                {option}
              </Text>
              {value === option && (
                <MaterialCommunityIcons name="check" size={20} color={colors.onPrimaryContainer} />
              )}
            </TouchableOpacity>
          ))}
        </Card>
      )}
    </View>
  );
};

export default function AgregarSemilla() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    variedad: '',
    origen: '',
    metodo_secado: '',
    seleccion: '',
    olor: '',
    color: '',
    integridad_pergamino: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSelectChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.variedad.trim()) {
      setError('La variedad es requerida');
      return false;
    }
    if (!form.origen.trim()) {
      setError('El origen es requerido');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await createSemilla(form);
      setSuccess(true);
    } catch (err) {
      setError('Error al guardar la semilla');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/Listarsemilla');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Agregar Semilla
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Completa la información de la nueva semilla
        </Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { borderColor: colors.error, backgroundColor: colors.error + '15' }]}>
          <View style={styles.errorContent}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        </View>
      )}

      {/* Success Banner */}
      {success && (
        <View style={[styles.errorBanner, { borderColor: '#4CAF50', backgroundColor: '#4CAF50' + '15' }]}>
          <View style={styles.errorContent}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={[styles.errorText, { color: '#4CAF50' }]}>
              ¡Semilla guardada exitosamente!
            </Text>
          </View>
        </View>
      )}

      {/* Form Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Card variant="elevated">
          {/* Section 1: Información Básica */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Información Básica
          </Text>

          {/* Variedad Input */}
          <PickerField
            label="Variedad *"
            value={form.variedad}
            options={VARIEDADES}
            onSelect={(value) => handleSelectChange('variedad', value)}
            colors={colors}
            icon="leaf"
          />

          {/* Origen Input */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Origen *</Text>
            <View style={[styles.inputContainer, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
              <MaterialCommunityIcons name="map-marker" size={18} color={colors.secondary} />
              <TextInput
                style={[styles.textInput, { color: colors.onSurface }]}
                placeholder="Ej: Huila, Colombia"
                placeholderTextColor={colors.onSurfaceVariant}
                value={form.origen}
                onChangeText={(value) => handleInputChange('origen', value)}
              />
            </View>
          </View>

          {/* Section 2: Proceso y Características */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface, marginTop: Spacing.lg }]}>
            Proceso y Características
          </Text>

          {/* Método Secado */}
          <PickerField
            label="Método de Secado"
            value={form.metodo_secado}
            options={METODOS_SECADO}
            onSelect={(value) => handleSelectChange('metodo_secado', value)}
            colors={colors}
            icon="fan"
          />

          {/* Método Selección */}
          <PickerField
            label="Método de Selección"
            value={form.seleccion}
            options={METODOS_SELECCION}
            onSelect={(value) => handleSelectChange('seleccion', value)}
            colors={colors}
            icon="filter"
          />

          {/* Section 3: Características Sensoriales */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface, marginTop: Spacing.lg }]}>
            Características Sensoriales
          </Text>

          {/* Olor */}
          <PickerField
            label="Olor"
            value={form.olor}
            options={OLORES}
            onSelect={(value) => handleSelectChange('olor', value)}
            colors={colors}
            icon="nose"
          />

          {/* Color */}
          <PickerField
            label="Color del Pergamino"
            value={form.color}
            options={COLORES_PERGAMINO}
            onSelect={(value) => handleSelectChange('color', value)}
            colors={colors}
            icon="palette"
          />

          {/* Section 4: Integridad */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface, marginTop: Spacing.lg }]}>
            Integridad del Pergamino
          </Text>

          {/* Integridad */}
          <PickerField
            label="Integridad"
            value={form.integridad_pergamino}
            options={INTEGRIDADS}
            onSelect={(value) => handleSelectChange('integridad_pergamino', value)}
            colors={colors}
            icon="check-circle"
          />
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Button
          title="Cancelar"
          onPress={handleCancel}
          variant="outlined"
          style={styles.cancelButton}
          disabled={loading}
        />
        <Button
          title={loading ? "Guardando..." : "Guardar"}
          onPress={handleSave}
          variant="primary"
          style={styles.saveButton}
          disabled={loading}
        />
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outlineVariant,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  errorBanner: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Public Sans',
  },
  dropdownContainer: {
    marginTop: Spacing.sm,
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outlineVariant,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.outlineVariant,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
