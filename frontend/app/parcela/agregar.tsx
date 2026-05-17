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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOpciones, addOpcion } from '@/services/catalogo_service';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button, Card } from '@/components';
import { createParcela } from '@/services/parcela_service';

// ── Constantes ───────────────────────────────────────────
const ESTADOS = ['Libre', 'En Proceso', 'En Producción'];
const TIPOS_TERRENO = ['Regular', 'Irregular'];
const TODAS_ZONAS = ['Zona Plana', 'Zona Inclinada', 'Zona Baja', 'Zona Alta'];
const TEXTURAS = ['Franco-arenosa', 'Franco-arcillosa'];
const ORIENTACIONES = ['Orientación al Norte', 'Orientación al Sur'];
const CORTINAS_OPTS = ['Sí', 'No'];

// ── Tipos ────────────────────────────────────────────────
interface FormState {
    codigo: string;
    hectareas: string;
    estado: string;
    tipo_terreno: string;
    tipo_zona: string[];      // 1 zona para Regular | 2-4 para Irregular
    ubicacion: string;
    ph_suelo: string;
    textura: string;
    orientacion_ladera: string;
    altitud_msnm: string;
    cortinas_rompevientos: string;
}

// ── Componentes ──────────────────────────────────────────

function SectionTitle({ title, colors }: { title: string; colors: any }) {
    return <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{title}</Text>;
}

function TextField({
    label, value, onChangeText, placeholder, icon, keyboardType = 'default', colors,
}: {
    label: string; value: string; onChangeText: (t: string) => void;
    placeholder: string; icon: string; keyboardType?: any; colors: any;
}) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
            <View style={[styles.inputRow, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
                <MaterialCommunityIcons name={icon as any} size={17} color={colors.secondary} />
                <TextInput
                    style={[styles.textInput, { color: colors.onSurface }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                />
            </View>
        </View>
    );
}

function PickerField({
    label, value, options: initialOptions, onSelect, icon, colors,
    allowAdd = true, storageKey,
}: {
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
                    <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
                    <TouchableOpacity onPress={() => { setShowNew(!showNew); setOpen(false); }} style={styles.addIconBtn}>
                        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.secondary} />
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
            )}
            <TouchableOpacity
                style={[styles.inputRow, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}
                onPress={() => { setOpen(!open); setShowNew(false); }} activeOpacity={0.7}>
                <MaterialCommunityIcons name={icon as any} size={17} color={colors.secondary} />
                <Text style={[styles.textInput, { color: value ? colors.onSurface : colors.onSurfaceVariant }]}>
                    {value || `Seleccionar ${label.replace(' *', '').toLowerCase()}`}
                </Text>
                <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.onSurfaceVariant} />
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
                            {value === opt && <MaterialCommunityIcons name="check" size={16} color={colors.onPrimaryContainer} />}
                        </TouchableOpacity>
                    ))}
                </Card>
            )}
        </View>
    );
}

/**
 * Selector de zonas:
 *  - Regular  → radio buttons (selección única de 1)
 *  - Irregular → checkboxes   (selección múltiple 2-4)
 */
function ZonaSelector({
    terreno, selected, onToggle, colors,
}: {
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
            <Text style={[styles.label, { color: colors.onSurface }]}>
                {isRegular ? 'Tipo de zona *' : 'Tipos de zona *'}
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
                            /* Radio button */
                            <View style={[styles.radio, { borderColor: isSelected ? accentColor : colors.outlineVariant }]}>
                                {isSelected && <View style={[styles.radioFill, { backgroundColor: accentColor }]} />}
                            </View>
                        ) : (
                            /* Checkbox */
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

            {/* Contador de selección para irregular */}
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

// ── Pantalla principal ───────────────────────────────────

export default function AgregarParcela() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [form, setForm] = useState<FormState>({
        codigo: '', hectareas: '', estado: 'Libre',
        tipo_terreno: '', tipo_zona: [],
        ubicacion: '', ph_suelo: '', textura: '',
        orientacion_ladera: '', altitud_msnm: '', cortinas_rompevientos: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const filterDecimal = (value: string) => {
        const cleaned = value.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    };

    const handleChange = (field: keyof FormState, value: string) => {
        let filtered = value;
        if (field === 'hectareas' || field === 'ph_suelo' || field === 'altitud_msnm') {
            filtered = filterDecimal(value);
        } else if (field === 'codigo') {
            filtered = value.slice(0, 20);
        }
        setForm((prev) => {
            const next = { ...prev, [field]: filtered } as FormState;
            if (field === 'tipo_terreno') next.tipo_zona = [];
            return next;
        });
        setError(null);
    };

    const handleZonaToggle = (zona: string) => {
        const isRegular = form.tipo_terreno === 'Regular';
        setForm((prev) => ({
            ...prev,
            tipo_zona: isRegular
                ? [zona]  // radio: reemplaza
                : prev.tipo_zona.includes(zona)
                    ? prev.tipo_zona.filter((z) => z !== zona)  // checkbox: deselect
                    : [...prev.tipo_zona, zona],                 // checkbox: select
        }));
        setError(null);
    };

    const validateForm = (): boolean => {
        if (!form.codigo.trim()) { setError('El código de parcela es obligatorio'); return false; }
        if (!form.hectareas.trim()) { setError('El número de hectáreas es obligatorio'); return false; }
        const ha = parseFloat(form.hectareas);
        if (isNaN(ha) || ha <= 0) { setError('Las hectáreas deben ser un número mayor a 0'); return false; }
        if (!form.tipo_terreno) { setError('El tipo de terreno es obligatorio'); return false; }
        if (form.tipo_zona.length === 0) { setError('Debes seleccionar al menos un tipo de zona'); return false; }
        if (form.tipo_terreno === 'Regular' && form.tipo_zona.length !== 1) {
            setError('Para terreno Regular, selecciona exactamente 1 tipo de zona'); return false;
        }
        if (form.tipo_terreno === 'Irregular' && form.tipo_zona.length < 2) {
            setError('Para terreno Irregular, selecciona al menos 2 tipos de zona'); return false;
        }
        if (!form.ph_suelo.trim()) { setError('El pH del suelo es obligatorio'); return false; }
        const ph = parseFloat(form.ph_suelo);
        if (isNaN(ph) || ph < 0 || ph > 14) { setError('El pH debe estar entre 0 y 14'); return false; }
        if (!form.textura) { setError('La textura del suelo es obligatoria'); return false; }
        if (!form.orientacion_ladera) { setError('La orientación de la ladera es obligatoria'); return false; }
        if (!form.altitud_msnm.trim()) { setError('La altitud es obligatoria'); return false; }
        const alt = parseFloat(form.altitud_msnm);
        if (isNaN(alt) || alt < 0) { setError('La altitud no puede ser un valor negativo'); return false; }
        if (!form.cortinas_rompevientos) { setError('Indica si existen cortinas rompevientos'); return false; }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            setLoading(true);
            await createParcela({
                codigo: form.codigo.trim(),
                hectareas: parseFloat(form.hectareas),
                estado: form.estado,
                tipo_terreno: form.tipo_terreno,
                tipo_zona: form.tipo_zona,
                ubicacion: form.ubicacion.trim() || null,
                ph_suelo: parseFloat(form.ph_suelo),
                textura: form.textura,
                orientacion_ladera: form.orientacion_ladera,
                altitud_msnm: parseFloat(form.altitud_msnm),
                cortinas_rompevientos: form.cortinas_rompevientos === 'Sí',
            });
            setSuccess(true);
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (typeof detail === 'string') setError(detail);
            else if (Array.isArray(detail)) setError(detail[0]?.msg ?? 'Error de validación');
            else setError('Error al guardar la parcela. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (success) {
            const t = setTimeout(() => router.back(), 1800);
            return () => clearTimeout(t);
        }
    }, [success]);

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.title, { color: colors.onSurface }]}>Nueva Parcela</Text>
                    <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                        Completa todos los campos obligatorios (*)
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
                    <Text style={[styles.bannerText, { color: colors.success }]}>
                        Parcela registrada con éxito
                    </Text>
                </View>
            )}

            {/* Formulario */}
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Sección 1: Datos Generales */}
                <Card variant="elevated" style={styles.card}>
                    <SectionTitle title="Datos Generales" colors={colors} />
                    <TextField label="Código de parcela *" value={form.codigo} onChangeText={(v) => handleChange('codigo', v)} placeholder="Ej: PAR-001-A" icon="identifier" colors={colors} />
                    <TextField label="Número de hectáreas *" value={form.hectareas} onChangeText={(v) => handleChange('hectareas', v)} placeholder="Ej: 2.5" icon="ruler-square" keyboardType="decimal-pad" colors={colors} />
                    <PickerField label="Estado actual *" value={form.estado} options={ESTADOS} onSelect={(v) => handleChange('estado', v)} icon="list-status" colors={colors} allowAdd={false} />
                </Card>

                {/* Sección 2: Clasificación */}
                <Card variant="elevated" style={styles.card}>
                    <SectionTitle title="Clasificación" colors={colors} />
                    <PickerField label="Tipo de terreno *" value={form.tipo_terreno} options={TIPOS_TERRENO} onSelect={(v) => handleChange('tipo_terreno', v)} icon="terrain" colors={colors} storageKey="custom_tipo_terreno" />

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
                </Card>

                {/* Sección 3: Características Técnicas */}
                <Card variant="elevated" style={styles.card}>
                    <SectionTitle title="Características Técnicas" colors={colors} />
                    <TextField label="Ubicación (coordenadas)" value={form.ubicacion} onChangeText={(v) => handleChange('ubicacion', v)} placeholder="Ej: 4.710989, -74.072092" icon="crosshairs-gps" colors={colors} />
                    <TextField label="pH del suelo * (0 - 14)" value={form.ph_suelo} onChangeText={(v) => handleChange('ph_suelo', v)} placeholder="Ej: 6.5" icon="flask-outline" keyboardType="decimal-pad" colors={colors} />
                    <PickerField label="Textura del suelo *" value={form.textura} options={TEXTURAS} onSelect={(v) => handleChange('textura', v)} icon="grain" colors={colors} storageKey="custom_textura" />
                    <PickerField label="Orientación de la ladera *" value={form.orientacion_ladera} options={ORIENTACIONES} onSelect={(v) => handleChange('orientacion_ladera', v)} icon="compass-outline" colors={colors} storageKey="custom_orientacion" />
                    <TextField label="Altitud (msnm) *" value={form.altitud_msnm} onChangeText={(v) => handleChange('altitud_msnm', v)} placeholder="Ej: 1850" icon="elevation-rise" keyboardType="decimal-pad" colors={colors} />
                    <PickerField label="Cortinas rompevientos *" value={form.cortinas_rompevientos} options={CORTINAS_OPTS} onSelect={(v) => handleChange('cortinas_rompevientos', v)} icon="weather-windy" colors={colors} allowAdd={false} />
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
    title: { ...Typography.displaySmall, marginBottom: 2 },
    subtitle: { ...Typography.bodyMedium },
    banner: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        marginHorizontal: Spacing.lg, marginTop: Spacing.md,
        borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md,
    },
    bannerText: { ...Typography.bodyMedium, fontWeight: '500', flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
    card: {},
    sectionTitle: { ...Typography.labelLarge, fontWeight: '600', marginBottom: Spacing.md },
    fieldContainer: { marginBottom: Spacing.md },
    label: { ...Typography.labelLarge, marginBottom: Spacing.sm },
    hint: { ...Typography.labelSmall, marginBottom: Spacing.sm },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    textInput: { flex: 1, ...Typography.bodyMedium },
    dropdown: { marginTop: Spacing.sm },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1,
    },
    dropdownItemText: { ...Typography.bodyMedium, flex: 1 },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    addIconBtn: { padding: 4 },
    addNewRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: BorderRadius.lg,
        paddingLeft: Spacing.md, marginTop: Spacing.sm,
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
