import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button, Card } from '@/components';
import { getParcelaById, updateParcela } from '@/services/parcela_service';

// ── Opciones ─────────────────────────────────────────────
const ESTADOS = ['Libre', 'En Proceso', 'En Producción'];
const TIPOS_TERRENO = ['Regular', 'Irregular'];
const TODAS_ZONAS = ['Zona Plana', 'Zona Inclinada', 'Zona Baja', 'Zona Alta'];
const TEXTURAS = ['Franco-arenosa', 'Franco-arcillosa'];
const ORIENTACIONES = ['Orientación al Norte', 'Orientación al Sur'];
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

interface EditForm {
    hectareas: string;
    estado: string;
    tipo_terreno: string;
    tipo_zona: string[];
    ubicacion: string;
    ph_suelo: string;
    textura: string;
    orientacion_ladera: string;
    cortinas_rompevientos: string;
}

function formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ── Sub-componentes ───────────────────────────────────────

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value?: string | number | boolean; colors: any }) {
    const display = value === true ? 'Sí' : value === false ? 'No' : value ?? '—';
    return (
        <View style={styles.infoRow}>
            <MaterialCommunityIcons name={icon as any} size={15} color={colors.secondary} />
            <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.onSurface }]} numberOfLines={2}>
                {String(display)}
            </Text>
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

function EditTextField({ label, value, onChangeText, placeholder, icon, keyboardType = 'default', colors }: {
    label: string; value: string; onChangeText: (t: string) => void;
    placeholder: string; icon: string; keyboardType?: any; colors: any;
}) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            <View style={[styles.inputRow, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
                <MaterialCommunityIcons name={icon as any} size={15} color={colors.secondary} />
                <TextInput
                    style={[styles.textInput, { color: colors.onSurface }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.onSurfaceVariant}
                    keyboardType={keyboardType}
                />
            </View>
        </View>
    );
}

function EditPickerField({ label, value, options, onSelect, icon, colors }: {
    label: string; value: string; options: string[];
    onSelect: (v: string) => void; icon: string; colors: any;
}) {
    const [open, setOpen] = useState(false);
    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            <TouchableOpacity
                style={[styles.inputRow, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}
                onPress={() => setOpen(!open)} activeOpacity={0.7}>
                <MaterialCommunityIcons name={icon as any} size={15} color={colors.secondary} />
                <Text style={[styles.textInput, { color: colors.onSurface }]}>{value}</Text>
                <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            {open && (
                <Card variant="filled" style={styles.dropdown}>
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            style={[styles.dropdownItem, { borderBottomColor: colors.outlineVariant }, value === opt && { backgroundColor: colors.primaryContainer }]}
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

function ZonaSelector({ terreno, selected, onToggle, colors }: {
    terreno: string; selected: string[];
    onToggle: (zona: string) => void; colors: any;
}) {
    const isRegular = terreno === 'Regular';
    const hint = isRegular
        ? 'Selecciona exactamente 1 tipo de zona'
        : 'Selecciona entre 2 y 4 tipos de zona';
    const accentColor = isRegular ? colors.primary : colors.secondary;
    const accentContainer = isRegular ? colors.primaryContainer : colors.secondaryContainer;

    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
                {isRegular ? 'Tipo de zona' : 'Tipos de zona'}
            </Text>
            <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>{hint}</Text>

            {TODAS_ZONAS.map((zona) => {
                const isSelected = selected.includes(zona);
                return (
                    <TouchableOpacity
                        key={zona}
                        onPress={() => onToggle(zona)}
                        activeOpacity={0.75}
                        style={[
                            styles.zonaItem,
                            {
                                borderColor: isSelected ? accentColor : colors.outlineVariant,
                                backgroundColor: isSelected ? accentContainer + '30' : colors.surfaceContainerLow,
                            },
                        ]}>
                        {isRegular ? (
                            <View style={[styles.radio, { borderColor: isSelected ? accentColor : colors.outlineVariant }]}>
                                {isSelected && <View style={[styles.radioFill, { backgroundColor: accentColor }]} />}
                            </View>
                        ) : (
                            <View style={[
                                styles.checkbox,
                                {
                                    borderColor: isSelected ? accentColor : colors.outlineVariant,
                                    backgroundColor: isSelected ? accentColor : 'transparent',
                                },
                            ]}>
                                {isSelected && <MaterialCommunityIcons name="check" size={13} color="#fff" />}
                            </View>
                        )}
                        <Text style={[styles.zonaText, { color: colors.onSurface }]}>{zona}</Text>
                    </TouchableOpacity>
                );
            })}

            {!isRegular && (
                <Text style={[
                    styles.zonaCount,
                    { color: selected.length >= 2 && selected.length <= 4 ? colors.success : colors.error },
                ]}>
                    {selected.length} zona{selected.length !== 1 ? 's' : ''} seleccionada{selected.length !== 1 ? 's' : ''}
                    {selected.length < 2 ? ' — mínimo 2' : selected.length > 4 ? ' — máximo 4' : ''}
                </Text>
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
    const [form, setForm] = useState<EditForm>({
        hectareas: '', estado: '', tipo_terreno: '', tipo_zona: [],
        ubicacion: '', ph_suelo: '', textura: '', orientacion_ladera: '',
        cortinas_rompevientos: '',
    });

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
            hectareas: String(data.hectareas),
            estado: data.estado,
            tipo_terreno: data.tipo_terreno,
            tipo_zona: Array.isArray(data.tipo_zona) ? data.tipo_zona : [data.tipo_zona],
            ubicacion: data.ubicacion ?? '',
            ph_suelo: String(data.ph_suelo),
            textura: data.textura,
            orientacion_ladera: data.orientacion_ladera,
            cortinas_rompevientos: data.cortinas_rompevientos ? 'Sí' : 'No',
        });
    };

    const handleChange = (field: keyof EditForm, value: string) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value } as EditForm;
            if (field === 'tipo_terreno') next.tipo_zona = [];
            return next;
        });
        setError(null);
        setSuccessMsg(null);
    };

    const handleZonaToggle = (zona: string) => {
        const isRegular = form.tipo_terreno === 'Regular';
        setForm((prev) => ({
            ...prev,
            tipo_zona: isRegular
                ? [zona]
                : prev.tipo_zona.includes(zona)
                    ? prev.tipo_zona.filter((z) => z !== zona)
                    : [...prev.tipo_zona, zona],
        }));
        setError(null);
        setSuccessMsg(null);
    };

    const validateEdit = (): boolean => {
        const ha = parseFloat(form.hectareas);
        if (isNaN(ha) || ha <= 0) { setError('Las hectáreas deben ser un número mayor a 0'); return false; }
        const ph = parseFloat(form.ph_suelo);
        if (isNaN(ph) || ph < 0 || ph > 14) { setError('El valor de pH modificado debe estar en el rango de 0 a 14'); return false; }
        if (form.tipo_zona.length === 0) { setError('Debes seleccionar al menos un tipo de zona'); return false; }
        if (form.tipo_terreno === 'Regular' && form.tipo_zona.length !== 1) {
            setError('Para terreno Regular, selecciona exactamente 1 tipo de zona'); return false;
        }
        if (form.tipo_terreno === 'Irregular' && (form.tipo_zona.length < 2 || form.tipo_zona.length > 4)) {
            setError('Para terreno Irregular, selecciona entre 2 y 4 tipos de zona'); return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateEdit()) return;
        try {
            setSaving(true);
            const updated = await updateParcela(id, {
                hectareas: parseFloat(form.hectareas),
                estado: form.estado,
                tipo_terreno: form.tipo_terreno,
                tipo_zona: form.tipo_zona,
                ubicacion: form.ubicacion.trim() || null,
                ph_suelo: parseFloat(form.ph_suelo),
                textura: form.textura,
                orientacion_ladera: form.orientacion_ladera,
                cortinas_rompevientos: form.cortinas_rompevientos === 'Sí',
            });
            setParcela(updated);
            resetForm(updated);
            setEditMode(false);
            setSuccessMsg(`Parcela actualizada correctamente — ${formatDate(updated.fecha_modificacion)}`);
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

    // ── Estados de carga / error ────────────────────────
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
    const zonasDisplay = Array.isArray(parcela.tipo_zona)
        ? parcela.tipo_zona.join(', ')
        : parcela.tipo_zona;

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

                {/* ── Datos Generales ── */}
                <Card variant="elevated">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Datos Generales</Text>

                    <ReadonlyField
                        label="Código de parcela"
                        value={parcela.codigo}
                        icon="identifier"
                        note="El código de parcela no puede modificarse"
                        colors={colors}
                    />

                    {editMode ? (
                        <>
                            <EditTextField label="Hectáreas" value={form.hectareas} onChangeText={(v) => handleChange('hectareas', v)} placeholder="Ej: 2.5" icon="ruler-square" keyboardType="decimal-pad" colors={colors} />
                            <EditPickerField label="Estado actual" value={form.estado} options={ESTADOS} onSelect={(v) => handleChange('estado', v)} icon="list-status" colors={colors} />
                        </>
                    ) : (
                        <>
                            <InfoRow icon="ruler-square" label="Hectáreas" value={`${parcela.hectareas} ha`} colors={colors} />
                            <InfoRow icon="list-status" label="Estado" value={parcela.estado} colors={colors} />
                        </>
                    )}
                </Card>

                {/* ── Clasificación ── */}
                <Card variant="elevated">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Clasificación</Text>
                    {editMode ? (
                        <>
                            <EditPickerField label="Tipo de terreno" value={form.tipo_terreno} options={TIPOS_TERRENO} onSelect={(v) => handleChange('tipo_terreno', v)} icon="terrain" colors={colors} />
                            {form.tipo_terreno ? (
                                <ZonaSelector
                                    terreno={form.tipo_terreno}
                                    selected={form.tipo_zona}
                                    onToggle={handleZonaToggle}
                                    colors={colors}
                                />
                            ) : (
                                <View style={[styles.fieldContainer, styles.zonaPlaceholder, { borderColor: colors.outlineVariant }]}>
                                    <MaterialCommunityIcons name="information-outline" size={16} color={colors.onSurfaceVariant} />
                                    <Text style={[styles.hint, { color: colors.onSurfaceVariant, marginBottom: 0 }]}>
                                        Selecciona primero el tipo de terreno
                                    </Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <>
                            <InfoRow icon="terrain" label="Tipo de terreno" value={parcela.tipo_terreno} colors={colors} />
                            <InfoRow icon="image-filter-hdr" label="Tipo de zona" value={zonasDisplay} colors={colors} />
                        </>
                    )}
                </Card>

                {/* ── Características Técnicas ── */}
                <Card variant="elevated">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Características Técnicas</Text>

                    {editMode ? (
                        <ReadonlyField
                            label="Altitud (msnm)"
                            value={String(parcela.altitud_msnm)}
                            icon="elevation-rise"
                            note="La altitud no puede modificarse una vez registrada"
                            colors={colors}
                        />
                    ) : (
                        <InfoRow icon="elevation-rise" label="Altitud" value={`${parcela.altitud_msnm} msnm`} colors={colors} />
                    )}

                    {editMode ? (
                        <>
                            <EditTextField label="Ubicación (coordenadas)" value={form.ubicacion} onChangeText={(v) => handleChange('ubicacion', v)} placeholder="Ej: 4.710989, -74.072092" icon="crosshairs-gps" colors={colors} />
                            <EditTextField label="pH del suelo (0 - 14)" value={form.ph_suelo} onChangeText={(v) => handleChange('ph_suelo', v)} placeholder="Ej: 6.5" icon="flask-outline" keyboardType="decimal-pad" colors={colors} />
                            <EditPickerField label="Textura del suelo" value={form.textura} options={TEXTURAS} onSelect={(v) => handleChange('textura', v)} icon="grain" colors={colors} />
                            <EditPickerField label="Orientación de la ladera" value={form.orientacion_ladera} options={ORIENTACIONES} onSelect={(v) => handleChange('orientacion_ladera', v)} icon="compass-outline" colors={colors} />
                            <EditPickerField label="Cortinas rompevientos" value={form.cortinas_rompevientos} options={CORTINAS_OPTS} onSelect={(v) => handleChange('cortinas_rompevientos', v)} icon="weather-windy" colors={colors} />
                        </>
                    ) : (
                        <>
                            <InfoRow icon="crosshairs-gps" label="Ubicación" value={parcela.ubicacion || 'No especificada'} colors={colors} />
                            <InfoRow icon="flask-outline" label="pH del suelo" value={String(parcela.ph_suelo)} colors={colors} />
                            <InfoRow icon="grain" label="Textura" value={parcela.textura} colors={colors} />
                            <InfoRow icon="compass-outline" label="Orientación" value={parcela.orientacion_ladera} colors={colors} />
                            <InfoRow icon="weather-windy" label="Cortinas rompevientos" value={parcela.cortinas_rompevientos} colors={colors} />
                        </>
                    )}
                </Card>

                {/* ── Auditoría ── */}
                <Card variant="outlined">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Registro</Text>
                    <InfoRow icon="calendar-plus" label="Fecha de registro" value={formatDate(parcela.fecha_creacion)} colors={colors} />
                    <InfoRow icon="calendar-edit" label="Última modificación" value={formatDate(parcela.fecha_modificacion)} colors={colors} />
                </Card>
            </ScrollView>

            {/* Footer edición */}
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
        alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.sm, paddingVertical: 2,
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
    hint: { ...Typography.labelSmall, marginBottom: Spacing.sm },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    textInput: { flex: 1, ...Typography.bodyMedium },
    dropdown: { marginTop: Spacing.sm },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1,
    },
    dropdownItemText: { ...Typography.bodyMedium, flex: 1 },
    infoChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        padding: Spacing.sm, borderRadius: BorderRadius.md, marginTop: -Spacing.xs,
    },
    infoChipText: { ...Typography.labelSmall, flex: 1 },
    // ── Zona Selector ──
    zonaPlaceholder: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderStyle: 'dashed', borderRadius: BorderRadius.lg,
        padding: Spacing.md,
    },
    zonaItem: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        borderWidth: 1.5, borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
        marginBottom: Spacing.sm,
    },
    radio: {
        width: 20, height: 20, borderRadius: BorderRadius.full,
        borderWidth: 2, justifyContent: 'center', alignItems: 'center',
    },
    radioFill: { width: 10, height: 10, borderRadius: BorderRadius.full },
    checkbox: {
        width: 20, height: 20, borderRadius: 4, borderWidth: 2,
        justifyContent: 'center', alignItems: 'center',
    },
    zonaText: { ...Typography.bodyMedium, flex: 1 },
    zonaCount: { ...Typography.labelSmall, fontWeight: '500', marginTop: Spacing.xs },
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
