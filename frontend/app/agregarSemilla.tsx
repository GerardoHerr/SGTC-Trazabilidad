import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card, Button } from '@/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createSemilla } from '@/services/semilla_service';

// Constantes para validación de archivo
const ALLOWED_FILE_TYPES = ['application/pdf', 'text/csv', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.csv', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes

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

interface FileData {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
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

const getFileIcon = (fileName: string): any => {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  switch (extension) {
    case '.pdf':
      return 'file-pdf-box';
    case '.csv':
      return 'file-csv';
    case '.jpg':
    case '.jpeg':
    case '.png':
      return 'file-image';
    default:
      return 'file';
  }
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
  const [anexo, setAnexo] = useState<FileData | null>(null);

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
      await createSemilla(form, anexo);
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

  const validateFile = (file: any): { valid: boolean; error?: string } => {
    // Validar extensión
    const fileName = file.name || '';
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Formato no permitido. Solo se aceptan: PDF, CSV, JPG, PNG`
      };
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `El archivo supera el tamaño máximo permitido (${sizeMB}MB)`
      };
    }

    return { valid: true };
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', 'image/jpeg', 'image/png']
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const validation = validateFile(file);
        
        if (!validation.valid) {
          setError(validation.error || 'Error al validar archivo');
          return;
        }

        setAnexo({
          uri: file.uri,
          name: file.name || 'archivo',
          size: file.size || 0,
          mimeType: file.mimeType
        });
        setError(null);
      }
    } catch (err) {
      setError('Error al seleccionar archivo');
      console.error(err);
    }
  };

  const handleRemoveFile = () => {
    setAnexo(null);
  };

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
            icon="scent"
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

          {/* Section 5: Anexo */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface, marginTop: Spacing.lg }]}>
            Anexo Adjunto
          </Text>

          {!anexo ? (
            <TouchableOpacity
              style={[styles.filePickerButton, { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer }]}
              onPress={handleSelectFile}
            >
              <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={colors.secondary} />
              <Text style={[styles.filePickerText, { color: colors.secondary }]}>
                Seleccionar Archivo
              </Text>
              <Text style={[styles.filePickerSubtext, { color: colors.onSurfaceVariant }]}>
                PDF, CSV, JPG o PNG (Máx. 5MB)
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.fileSelectedContainer, { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer + '20' }]}>
              <View style={styles.fileInfo}>
                <MaterialCommunityIcons 
                  name={getFileIcon(anexo.name)} 
                  size={24} 
                  color={colors.secondary} 
                  style={styles.fileIcon}
                />
                <View style={styles.fileDetails}>
                  <Text style={[styles.fileName, { color: colors.onSurface }]} numberOfLines={1}>
                    {anexo.name}
                  </Text>
                  <Text style={[styles.fileSize, { color: colors.onSurfaceVariant }]}>
                    {(anexo.size / 1024).toFixed(2)} KB
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveFile}>
                <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
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
  filePickerButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  filePickerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filePickerSubtext: {
    fontSize: 12,
    fontWeight: '400',
  },
  fileSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  fileIcon: {
    marginRight: Spacing.sm,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: Spacing.xs,
  },
});
