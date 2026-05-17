import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator, ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOpciones, addOpcion } from '@/services/catalogo_service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card, Button } from '@/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createSemilla } from '@/services/semilla_service';

const ALLOWED_EXTENSIONS = ['.pdf', '.csv', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const VARIEDADES_INICIALES = ['Caturra', 'Castillo', 'Geisha', 'Bourbon', 'Típica'];
const DISTRIBUIDORES_INICIALES = ['Almacafé S.A.', 'FNC', 'Agroinsumos del Sur', 'Semillas Andinas'];

interface FormState {
    variedad: string;
    origen: string;
    distribuidor: string;
}

interface FileData {
    uri: string;
    name: string;
    size: number;
    mimeType?: string;
}

// ── PickerField con botón "+" para agregar opciones inline ──
function PickerField({
    label, value, options: initialOptions, onSelect, icon, colors, storageKey,
}: {
    label: string; value: string; options: string[];
    onSelect: (v: string) => void; icon: string; colors: any; storageKey?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState(initialOptions);
    const [showNew, setShowNew] = useState(false);
    const [newItem, setNewItem] = useState('');
    const [confirmando, setConfirmando] = useState(false);

    useEffect(() => {
        if (!storageKey) return;
        getOpciones(storageKey)
            .then((serverOpts: string[]) => {
                setOptions([...new Set([...initialOptions, ...serverOpts])]);
                AsyncStorage.setItem(storageKey, JSON.stringify(serverOpts));
            })
            .catch(() => {
                AsyncStorage.getItem(storageKey).then(stored => {
                    if (stored) {
                        const cached: string[] = JSON.parse(stored);
                        setOptions(prev => [...new Set([...prev, ...cached])]);
                    }
                });
            });
    }, []);

    const handleAddNew = () => {
        if (!newItem.trim()) return;
        setConfirmando(true);
    };

    const confirmAdd = async () => {
        const trimmed = newItem.trim();
        setConfirmando(false);
        try {
            const serverOpts: string[] = storageKey
                ? await addOpcion(storageKey, trimmed)
                : [...options, trimmed];
            const merged = [...new Set([...initialOptions, ...serverOpts])];
            setOptions(merged);
            if (storageKey) AsyncStorage.setItem(storageKey, JSON.stringify(serverOpts));
        } catch {
            const updated = options.includes(trimmed) ? options : [...options, trimmed];
            setOptions(updated);
            if (storageKey) {
                const custom = updated.filter(o => !initialOptions.includes(o));
                AsyncStorage.setItem(storageKey, JSON.stringify(custom));
            }
        }
        onSelect(trimmed);
        setNewItem('');
        setShowNew(false);
        setIsOpen(false);
    };

    return (
        <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
                <TouchableOpacity
                    onPress={() => { setShowNew(!showNew); setIsOpen(false); }}
                    style={styles.addIconBtn}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.secondary} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.pickerButton, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}
                onPress={() => { setIsOpen(!isOpen); setShowNew(false); }}>
                <MaterialCommunityIcons name={icon as any} size={18} color={colors.secondary} />
                <Text style={[styles.pickerText, { color: value ? colors.onSurface : colors.onSurfaceVariant }]}>
                    {value || `Seleccionar ${label.replace(' *', '').toLowerCase()}`}
                </Text>
                <MaterialCommunityIcons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>

            {showNew && (
                <View style={[styles.addNewRow, { borderColor: colors.secondary, backgroundColor: colors.surfaceContainerLow }]}>
                    <TextInput
                        style={[styles.addNewInput, { color: colors.onSurface }]}
                        placeholder="Nuevo valor..."
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={newItem}
                        onChangeText={(t) => { setNewItem(t); setConfirmando(false); }}
                        autoFocus
                    />
                    <TouchableOpacity onPress={handleAddNew} style={[styles.addNewConfirm, { backgroundColor: colors.secondary }]}>
                        <MaterialCommunityIcons name="check" size={16} color={colors.onSecondary ?? '#fff'} />
                    </TouchableOpacity>
                </View>
            )}

            {confirmando && (
                <View style={[styles.confirmRow, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }]}>
                    <Text style={[styles.confirmText, { color: colors.onPrimaryContainer }]} numberOfLines={1}>
                        ¿Añadir "{newItem.trim()}"?
                    </Text>
                    <TouchableOpacity onPress={confirmAdd} style={[styles.confirmSi, { backgroundColor: colors.primary }]}>
                        <Text style={{ color: colors.onPrimary ?? '#fff', fontSize: 13, fontWeight: '700' }}>Sí</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setConfirmando(false)} style={[styles.confirmNo, { borderColor: colors.primary }]}>
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>No</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isOpen && (
                <Card variant="filled" style={styles.dropdown}>
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            style={[styles.dropdownItem, { borderBottomColor: colors.outlineVariant },
                                value === opt && { backgroundColor: colors.primaryContainer }]}
                            onPress={() => { onSelect(opt); setIsOpen(false); }}>
                            <Text style={[styles.dropdownItemText, {
                                color: value === opt ? colors.onPrimaryContainer : colors.onSurface,
                            }]}>
                                {opt}
                            </Text>
                            {value === opt && <MaterialCommunityIcons name="check" size={18} color={colors.onPrimaryContainer} />}
                        </TouchableOpacity>
                    ))}
                </Card>
            )}
        </View>
    );
}

const getFileIcon = (name: string): any => {
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    if (ext === '.pdf') return 'file-pdf-box';
    if (ext === '.csv') return 'file-csv';
    if (['.jpg', '.jpeg', '.png'].includes(ext)) return 'file-image';
    return 'file';
};

export default function AgregarSemilla() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { returnToLoteId } = useLocalSearchParams();
    const loteIdRetorno = Array.isArray(returnToLoteId) ? returnToLoteId[0] : returnToLoteId ?? null;

    const [form, setForm] = useState<FormState>({ variedad: '', origen: '', distribuidor: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [anexo, setAnexo] = useState<FileData | null>(null);

    const handleChange = (field: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateForm = () => {
        if (!form.variedad.trim()) { setError('La variedad es requerida'); return false; }
        if (!form.origen.trim()) { setError('El origen es requerido'); return false; }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            setLoading(true);
            await createSemilla({
                variedad: form.variedad,
                origen: form.origen,
                distribuidor: form.distribuidor.trim() || undefined,
            }, anexo);
            setSuccess(true);
        } catch (err) {
            setError('Error al guardar la semilla. Intenta de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (success) {
            const t = setTimeout(() => {
                if (loteIdRetorno) {
                    router.replace({ pathname: '/lote/[id]' as any, params: { id: loteIdRetorno } });
                } else {
                    router.push('/Listarsemilla');
                }
            }, 1800);
            return () => clearTimeout(t);
        }
    }, [success]);

    const handleSelectFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/csv', 'image/jpeg', 'image/png'],
            });
            if (!result.canceled && result.assets?.length) {
                const file = result.assets[0];
                const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                if (!ALLOWED_EXTENSIONS.includes(ext)) {
                    setError('Formato no permitido. Solo PDF, CSV, JPG o PNG.');
                    return;
                }
                if ((file.size ?? 0) > MAX_FILE_SIZE) {
                    setError('El archivo supera el límite de 5 MB.');
                    return;
                }
                setAnexo({ uri: file.uri, name: file.name, size: file.size ?? 0, mimeType: file.mimeType });
                setError(null);
            }
        } catch (err) {
            setError('Error al seleccionar archivo.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.title, { color: colors.onSurface }]}>Nueva Semilla</Text>
                    <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                        Completa los campos obligatorios (*)
                    </Text>
                </View>
            </View>

            {/* Banners */}
            {error && (
                <View style={[styles.banner, { borderColor: colors.error, backgroundColor: colors.error + '15' }]}>
                    <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
                    <Text style={[styles.bannerText, { color: colors.error }]}>{error}</Text>
                </View>
            )}
            {success && (
                <View style={[styles.banner, { borderColor: colors.success, backgroundColor: colors.success + '15' }]}>
                    <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                    <Text style={[styles.bannerText, { color: colors.success }]}>¡Semilla guardada exitosamente!</Text>
                </View>
            )}

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Card variant="elevated">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Información de la Semilla</Text>

                    <PickerField
                        label="Variedad *"
                        value={form.variedad}
                        options={VARIEDADES_INICIALES}
                        onSelect={(v) => handleChange('variedad', v)}
                        icon="leaf"
                        colors={colors}
                        storageKey="custom_variedad"
                    />

                    <View style={styles.fieldContainer}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>Origen *</Text>
                        <View style={[styles.inputRow, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
                            <MaterialCommunityIcons name="map-marker" size={18} color={colors.secondary} />
                            <TextInput
                                style={[styles.textInput, { color: colors.onSurface }]}
                                placeholder="Ej: Huila, Colombia"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={form.origen}
                                onChangeText={(v) => handleChange('origen', v)}
                            />
                        </View>
                    </View>

                    <PickerField
                        label="Distribuidor"
                        value={form.distribuidor}
                        options={DISTRIBUIDORES_INICIALES}
                        onSelect={(v) => handleChange('distribuidor', v)}
                        icon="truck-delivery-outline"
                        colors={colors}
                        storageKey="custom_distribuidor"
                    />
                </Card>

                {/* Anexo */}
                <Card variant="elevated">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Anexo Adjunto</Text>

                    {!anexo ? (
                        <TouchableOpacity
                            style={[styles.filePickerBtn, { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer }]}
                            onPress={handleSelectFile}>
                            <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={colors.secondary} />
                            <Text style={[styles.filePickerText, { color: colors.secondary }]}>Seleccionar Archivo</Text>
                            <Text style={[styles.filePickerSub, { color: colors.onSurfaceVariant }]}>PDF, CSV, JPG o PNG (máx. 5 MB)</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.fileSelected, { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer + '20' }]}>
                            <MaterialCommunityIcons name={getFileIcon(anexo.name)} size={24} color={colors.secondary} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.fileName, { color: colors.onSurface }]} numberOfLines={1}>{anexo.name}</Text>
                                <Text style={[styles.fileSize, { color: colors.onSurfaceVariant }]}>
                                    {(anexo.size / 1024).toFixed(1)} KB
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setAnexo(null)}>
                                <MaterialCommunityIcons name="close-circle" size={22} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                </Card>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
                <Button title="Cancelar" onPress={() => router.back()} variant="outlined" style={styles.footerBtn} disabled={loading} />
                <Button title={loading ? 'Guardando...' : 'Guardar'} onPress={handleSave} variant="primary" style={styles.footerBtn} disabled={loading || success} />
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1,
    },
    backBtn: { padding: Spacing.xs },
    title: { fontSize: 24, fontWeight: '700', marginBottom: 2 },
    subtitle: { fontSize: 13, fontWeight: '400' },
    banner: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        marginHorizontal: Spacing.lg, marginTop: Spacing.md,
        borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md,
    },
    bannerText: { fontSize: 14, fontWeight: '500', flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
    sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: Spacing.md },
    fieldContainer: { marginBottom: Spacing.lg },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    label: { fontSize: 14, fontWeight: '500' },
    addIconBtn: { padding: 4 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    textInput: { flex: 1, fontSize: 14 },
    pickerButton: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    pickerText: { flex: 1, fontSize: 14 },
    addNewRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: BorderRadius.lg,
        paddingLeft: Spacing.md, marginTop: Spacing.sm,
    },
    addNewInput: { flex: 1, fontSize: 14, paddingVertical: Spacing.sm },
    addNewConfirm: {
        padding: Spacing.sm, borderRadius: BorderRadius.lg, margin: 4,
    },
    confirmRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginTop: Spacing.xs,
    },
    confirmText: { flex: 1, fontSize: 13, fontWeight: '500' },
    confirmSi: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
    confirmNo: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1 },
    dropdown: { marginTop: Spacing.sm },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1,
    },
    dropdownItemText: { fontSize: 14, flex: 1 },
    filePickerBtn: {
        borderWidth: 2, borderStyle: 'dashed', borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.xl, paddingHorizontal: Spacing.lg,
        alignItems: 'center', gap: Spacing.sm,
    },
    filePickerText: { fontSize: 15, fontWeight: '600' },
    filePickerSub: { fontSize: 12 },
    fileSelected: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md,
    },
    fileName: { fontSize: 13, fontWeight: '600' },
    fileSize: { fontSize: 11, marginTop: 2 },
    footer: {
        flexDirection: 'row', gap: Spacing.md,
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, borderTopWidth: 1,
    },
    footerBtn: { flex: 1 },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center', alignItems: 'center',
    },
});
