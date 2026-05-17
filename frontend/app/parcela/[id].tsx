import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOpciones, addOpcion } from '@/services/catalogo_service';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button, Card } from '@/components';
import { getParcelaById, updateParcela } from '@/services/parcela_service';

const TEXTURAS = ['Franco-arenosa', 'Franco-arcillosa'];
const CORTINAS_OPTS = ['Sí', 'No'];

const ESTADO_COLOR: Record<string, string> = {
    Libre: '#0f7938',
    'En Proceso': '#b45309',
    'En Producción': '#3a6843',
};

interface Parcela {
    id: number;
    codigo: string;
    hectareas: number;
    estado: string;
    tipo_terreno: string;
    tipo_zona: string[];
    ubicacion?: string;
    ph_suelo: number;
    textura: string;
    orientacion_ladera: string;
    altitud_msnm: number;
    cortinas_rompevientos: boolean;
    fecha_creacion: string;
    fecha_modificacion: string;
}

// Solo estos 3 campos son editables
interface EditForm {
    ph_suelo: string;
    textura: string;
    cortinas_rompevientos: string;
}

function formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value?: string | number | boolean; colors: any }) {
    const display = value === true ? 'Sí' : value === false ? 'No' : value ?? '—';
    return (
        <View style={styles.infoRow}>
            <MaterialCommunityIcons name={icon as any} size={15} color={colors.secondary} />
            <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.onSurface }]} numberOfLines={2}>{String(display)}</Text>
        </View>
    );
}

function ReadonlyField({ label, value, icon, note, colors }: { label: string; value: string; icon: string; note?: string; colors: any }) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            <View style={[styles.inputRow, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow, opacity: 0.65 }]}>
                <MaterialCommunityIcons name={icon as any} size={15} color={colors.onSurfaceVariant} />
                <Text style={[styles.textInput, { color: colors.onSurfaceVariant }]}>{value}</Text>
                <MaterialCommunityIcons name="lock-outline" size={14} color={colors.onSurfaceVariant} />
            </View>
            {note && (
                <View style={[styles.infoChip, { backgroundColor: colors.surfaceContainerLow }]}>
                    <MaterialCommunityIcons name="information-outline" size={13} color={colors.onSurfaceVariant} />
                    <Text style={[styles.infoChipText, { color: colors.onSurfaceVariant }]}>{note}</Text>
                </View>
            )}
        </View>
    );
}

// ── PickerField con botón "+" ──────────────────────────────
function EditPickerField({ label, value, options: initialOptions, onSelect, icon, colors, allowAdd = true, storageKey }: {
    label: string; value: string; options: string[];
    onSelect: (v: string) => void; icon: string; colors: any;
    allowAdd?: boolean; storageKey?: string;
}) {
    const [open, setOpen] = useState(false);
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
        setOpen(false);
    };

    return (
        <View style={styles.fieldContainer}>
            {allowAdd ? (
                <View style={styles.labelRow}>
                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
                    <TouchableOpacity onPress={() => { setShowNew(!showNew); setOpen(false); }} style={styles.addIconBtn}>
                        <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.secondary} />
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            )}
            <TouchableOpacity
                style={[styles.inputRow, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}
                onPress={() => { setOpen(!open); setShowNew(false); }} activeOpacity={0.7}>
                <MaterialCommunityIcons name={icon as any} size={15} color={colors.secondary} />
                <Text style={[styles.textInput, { color: colors.onSurface }]}>{value}</Text>
                <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            {allowAdd && showNew && (
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
                        <MaterialCommunityIcons name="check" size={14} color={colors.onSecondary ?? '#fff'} />
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
            {open && (
                <Card variant="filled" style={styles.dropdown}>
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            style={[styles.dropdownItem, { borderBottomColor: colors.outlineVariant },
                                value === opt && { backgroundColor: colors.primaryContainer }]}
                            onPress={() => { onSelect(opt); setOpen(false); }}>
                            <Text style={[styles.dropdownItemText, { color: value === opt ? colors.onPrimaryContainer : colors.onSurface }]}>
                                {opt}
                            </Text>
                            {value === opt && <MaterialCommunityIcons name="check" size={15} color={colors.onPrimaryContainer} />}
                        </TouchableOpacity>
                    ))}
                </Card>
            )}
        </View>
    );
}

// ── Pantalla principal ────────────────────────────────────

export default function DetalleParcela() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [parcela, setParcela] = useState<Parcela | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [form, setForm] = useState<EditForm>({ ph_suelo: '', textura: '', cortinas_rompevientos: '' });

    useEffect(() => { loadParcela(); }, [id]);

    const loadParcela = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getParcelaById(id);
            setParcela(data);
            resetForm(data);
        } catch {
            setError('No se pudo cargar la parcela.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = (data: Parcela) => {
        setForm({
            ph_suelo: String(data.ph_suelo),
            textura: data.textura,
            cortinas_rompevientos: data.cortinas_rompevientos ? 'Sí' : 'No',
        });
    };

    const handleChange = (field: keyof EditForm, value: string) => {
        let filtered = value;
        if (field === 'ph_suelo') {
            const cleaned = value.replace(/[^0-9.]/g, '');
            const parts = cleaned.split('.');
            filtered = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
        }
        setForm(prev => ({ ...prev, [field]: filtered }));
        setError(null);
        setSuccessMsg(null);
    };

    const validateEdit = (): boolean => {
        const ph = parseFloat(form.ph_suelo);
        if (isNaN(ph) || ph < 0 || ph > 14) {
            setError('El pH debe estar entre 0 y 14'); return false;
        }
        if (!form.textura) { setError('La textura es obligatoria'); return false; }
        if (!form.cortinas_rompevientos) { setError('Indica si existen cortinas rompevientos'); return false; }
        return true;
    };

    const handleSave = async () => {
        if (!validateEdit()) return;
        try {
            setSaving(true);
            const updated = await updateParcela(id, {
                ph_suelo: parseFloat(form.ph_suelo),
                textura: form.textura,
                cortinas_rompevientos: form.cortinas_rompevientos === 'Sí',
            });
            setParcela(updated);
            resetForm(updated);
            setEditMode(false);
            setSuccessMsg(`Parcela actualizada — ${formatDate(updated.fecha_modificacion)}`);
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Error al guardar los cambios.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (parcela) resetForm(parcela);
        setEditMode(false);
        setError(null);
    };

    if (loading) {
        return (
            <View style={[styles.fullCenter, { backgroundColor: colors.surface }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.stateText, { color: colors.onSurfaceVariant }]}>Cargando parcela...</Text>
            </View>
        );
    }

    if (!parcela) {
        return (
            <View style={[styles.fullCenter, { backgroundColor: colors.surface }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <MaterialCommunityIcons name="alert-circle-outline" size={52} color={colors.error} />
                <Text style={[styles.stateText, { color: colors.error }]}>{error}</Text>
                <Button title="Reintentar" onPress={loadParcela} variant="primary" />
                <Button title="Volver" onPress={() => router.back()} variant="outlined" />
            </View>
        );
    }

    const estadoColor = ESTADO_COLOR[parcela.estado] ?? colors.primary;
    const zonasDisplay = Array.isArray(parcela.tipo_zona) ? parcela.tipo_zona.join(', ') : parcela.tipo_zona;

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: colors.onSurface }]}>{parcela.codigo}</Text>
                    <View style={[styles.estadoBadge, { backgroundColor: estadoColor + '20', borderColor: estadoColor + '55' }]}>
                        <Text style={[styles.estadoText, { color: estadoColor }]}>{parcela.estado}</Text>
                    </View>
                </View>
                {!editMode && (
                    <TouchableOpacity
                        onPress={() => { setEditMode(true); setSuccessMsg(null); }}
                        style={[styles.editBtn, { backgroundColor: colors.secondaryContainer }]}>
                        <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.onSecondaryContainer} />
                        <Text style={[styles.editBtnText, { color: colors.onSecondaryContainer }]}>Editar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Banners */}
            {successMsg && (
                <View style={[styles.banner, { borderColor: colors.success, backgroundColor: colors.success + '15' }]}>
                    <MaterialCommunityIcons name="check-circle" size={17} color={colors.success} />
                    <Text style={[styles.bannerText, { color: colors.success }]}>{successMsg}</Text>
                </View>
            )}
            {error && (
                <View style={[styles.banner, { borderColor: colors.error, backgroundColor: colors.error + '15' }]}>
                    <MaterialCommunityIcons name="alert-circle" size={17} color={colors.error} />
                    <Text style={[styles.bannerText, { color: colors.error }]}>{error}</Text>
                </View>
            )}

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Datos Generales — siempre solo lectura */}
                <Card variant="elevated">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Datos Generales</Text>
                    <ReadonlyField label="Código" value={parcela.codigo} icon="identifier"
                        note="El código no puede modificarse" colors={colors} />
                    <InfoRow icon="ruler-square" label="Hectáreas" value={`${parcela.hectareas} ha`} colors={colors} />
                    <InfoRow icon="list-status" label="Estado" value={parcela.estado} colors={colors} />
                </Card>

                {/* Clasificación — siempre solo lectura */}
                <Card variant="elevated">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Clasificación</Text>
                    <InfoRow icon="terrain" label="Tipo de terreno" value={parcela.tipo_terreno} colors={colors} />
                    <InfoRow icon="image-filter-hdr" label="Tipo de zona" value={zonasDisplay} colors={colors} />
                </Card>

                {/* Características Técnicas — 3 campos editables */}
                <Card variant="elevated">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Características Técnicas</Text>
                    <ReadonlyField label="Altitud (msnm)" value={String(parcela.altitud_msnm)} icon="elevation-rise"
                        note="La altitud no puede modificarse" colors={colors} />
                    <InfoRow icon="crosshairs-gps" label="Ubicación" value={parcela.ubicacion || 'No especificada'} colors={colors} />
                    <InfoRow icon="compass-outline" label="Orientación" value={parcela.orientacion_ladera} colors={colors} />

                    {/* pH — editable */}
                    {editMode ? (
                        <View style={styles.fieldContainer}>
                            <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>pH del suelo (0–14)</Text>
                            <View style={[styles.inputRow, { borderColor: colors.secondary, backgroundColor: colors.surfaceContainerLow }]}>
                                <MaterialCommunityIcons name="flask-outline" size={15} color={colors.secondary} />
                                <TextInput
                                    style={[styles.textInput, { color: colors.onSurface }]}
                                    value={form.ph_suelo}
                                    onChangeText={(v) => handleChange('ph_suelo', v)}
                                    placeholder="Ej: 6.5"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>
                    ) : (
                        <InfoRow icon="flask-outline" label="pH del suelo" value={String(parcela.ph_suelo)} colors={colors} />
                    )}

                    {/* Textura — editable */}
                    {editMode ? (
                        <EditPickerField label="Textura del suelo" value={form.textura} options={TEXTURAS}
                            onSelect={(v) => handleChange('textura', v)} icon="grain" colors={colors} storageKey="custom_textura" />
                    ) : (
                        <InfoRow icon="grain" label="Textura" value={parcela.textura} colors={colors} />
                    )}

                    {/* Cortinas — editable */}
                    {editMode ? (
                        <EditPickerField label="Cortinas rompevientos" value={form.cortinas_rompevientos} options={CORTINAS_OPTS}
                            onSelect={(v) => handleChange('cortinas_rompevientos', v)} icon="weather-windy" colors={colors} allowAdd={false} />
                    ) : (
                        <InfoRow icon="weather-windy" label="Cortinas rompevientos" value={parcela.cortinas_rompevientos} colors={colors} />
                    )}

                    {editMode && (
                        <View style={[styles.infoChip, { backgroundColor: colors.secondaryContainer + '60' }]}>
                            <MaterialCommunityIcons name="information-outline" size={13} color={colors.secondary} />
                            <Text style={[styles.infoChipText, { color: colors.secondary }]}>
                                Solo pH, textura y cortinas rompevientos pueden modificarse
                            </Text>
                        </View>
                    )}
                </Card>

                {/* Auditoría */}
                <Card variant="outlined">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Registro</Text>
                    <InfoRow icon="calendar-plus" label="Fecha de registro" value={formatDate(parcela.fecha_creacion)} colors={colors} />
                    <InfoRow icon="calendar-edit" label="Última modificación" value={formatDate(parcela.fecha_modificacion)} colors={colors} />
                </Card>

                {/* Acciones - Lotes */}
                <Card variant="elevated">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Gestión de Lotes</Text>
                    <Button
                        title="Crear Lotes"
                        onPress={() => router.push({ pathname: '/agregarLotes' as any, params: { parcelaId: parcela.id } })}
                        variant="primary"
                        style={{ marginBottom: Spacing.sm }}
                    />
                    <Button
                        title="Ver Lotes"
                        onPress={() => router.push({ pathname: '/ListarLotes' as any, params: { parcelaId: parcela.id } })}
                        variant="outlined"
                    />
                </Card>
            </ScrollView>

            {editMode && (
                <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
                    <Button title="Cancelar" onPress={handleCancel} variant="outlined" style={styles.footerBtn} disabled={saving} />
                    <Button title={saving ? 'Guardando...' : 'Guardar cambios'} onPress={handleSave} variant="primary" style={styles.footerBtn} disabled={saving} />
                </View>
            )}

            {saving && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    fullCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
    stateText: { ...Typography.bodyLarge, textAlign: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1,
    },
    backBtn: { padding: Spacing.xs },
    title: { ...Typography.headlineMedium, marginBottom: 4 },
    estadoBadge: {
        alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2,
        borderRadius: BorderRadius.full, borderWidth: 1,
    },
    estadoText: { ...Typography.labelSmall, fontWeight: '600' },
    editBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    },
    editBtnText: { ...Typography.labelLarge },
    banner: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        marginHorizontal: Spacing.lg, marginTop: Spacing.md,
        borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md,
    },
    bannerText: { ...Typography.bodyMedium, fontWeight: '500', flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
    sectionTitle: { ...Typography.labelLarge, fontWeight: '600', marginBottom: Spacing.md },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
    infoLabel: { ...Typography.labelMedium, minWidth: 130 },
    infoValue: { ...Typography.bodyMedium, fontWeight: '500', flex: 1 },
    fieldContainer: { marginBottom: Spacing.md },
    fieldLabel: { ...Typography.labelMedium, marginBottom: Spacing.sm },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    addIconBtn: { padding: 4 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    textInput: { flex: 1, ...Typography.bodyMedium },
    addNewRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: BorderRadius.lg, paddingLeft: Spacing.md, marginTop: Spacing.sm,
    },
    addNewInput: { flex: 1, ...Typography.bodyMedium, paddingVertical: Spacing.sm },
    addNewConfirm: { padding: Spacing.sm, borderRadius: BorderRadius.lg, margin: 4 },
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
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1,
    },
    dropdownItemText: { ...Typography.bodyMedium, flex: 1 },
    infoChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        padding: Spacing.sm, borderRadius: BorderRadius.md, marginTop: Spacing.xs,
    },
    infoChipText: { ...Typography.labelSmall, flex: 1 },
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
