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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button, Card } from '@/components';
import { getPersonalById, updatePersonal } from '@/services/personal_service';

const ROLES = ['Recolector', 'Fumigador', 'Operario', 'Supervisor', 'Capataz'];

interface Trabajador {
    id: number;
    nombres: string;
    apellidos: string;
    identificacion: string;
    telefono: string;
    rol: string;
    fecha_creacion: string;
    fecha_modificacion: string;
    tiene_asignaciones_activas: boolean;
}

interface EditForm {
    nombres: string;
    apellidos: string;
    identificacion: string;
    telefono: string;
    rol: string;
}

function formatDate(isoDate: string): string {
    if (!isoDate) return '—';
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

interface PickerFieldProps {
    label: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    icon: string;
    colors: any;
    storageKey?: string;
}

function PickerField({ label, value, options: initialOptions, onSelect, icon, colors, storageKey }: PickerFieldProps) {
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
                <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
                <TouchableOpacity onPress={() => { setShowNew(!showNew); setIsOpen(false); }} style={styles.addIconBtn}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.secondary} />
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={[styles.pickerButton, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}
                onPress={() => { setIsOpen(!isOpen); setShowNew(false); }} activeOpacity={0.7}>
                <MaterialCommunityIcons name={icon as any} size={16} color={colors.secondary} />
                <Text style={[styles.pickerText, { color: colors.onSurface }]}>{value}</Text>
                <MaterialCommunityIcons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.onSurfaceVariant} />
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
            {isOpen && (
                <Card variant="filled" style={styles.dropdown}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[styles.dropdownItem, { borderBottomColor: colors.outlineVariant },
                                value === option && { backgroundColor: colors.primaryContainer }]}
                            onPress={() => { onSelect(option); setIsOpen(false); }}>
                            <Text style={[styles.dropdownItemText, {
                                color: value === option ? colors.onPrimaryContainer : colors.onSurface,
                            }]}>
                                {option}
                            </Text>
                            {value === option && <MaterialCommunityIcons name="check" size={16} color={colors.onPrimaryContainer} />}
                        </TouchableOpacity>
                    ))}
                </Card>
            )}
        </View>
    );
}

export default function PerfilTrabajador() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [trabajador, setTrabajador] = useState<Trabajador | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [form, setForm] = useState<EditForm>({
        nombres: '',
        apellidos: '',
        identificacion: '',
        telefono: '',
        rol: '',
    });

    useEffect(() => {
        loadTrabajador();
    }, [id]);

    const loadTrabajador = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getPersonalById(id);
            setTrabajador(data);
            setForm({
                nombres: data.nombres,
                apellidos: data.apellidos,
                identificacion: data.identificacion,
                telefono: data.telefono,
                rol: data.rol,
            });
        } catch {
            setError('No se pudo cargar el perfil del trabajador.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof EditForm, value: string) => {
        let filtered = value;
        if (field === 'nombres' || field === 'apellidos') {
            filtered = value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-']/g, '').slice(0, 80);
        } else if (field === 'identificacion') {
            filtered = value.replace(/\D/g, '').slice(0, 10);
        } else if (field === 'telefono') {
            filtered = value.replace(/\D/g, '').slice(0, 10);
        }
        setForm((prev) => ({ ...prev, [field]: filtered }));
        setSuccessMsg(null);
        setError(null);
    };

    const validateForm = (): boolean => {
        if (!form.nombres.trim()) { setError('El campo Nombres es obligatorio'); return false; }
        if (form.nombres.trim().length < 2) { setError('El nombre debe tener al menos 2 caracteres'); return false; }
        if (!form.apellidos.trim()) { setError('El campo Apellidos es obligatorio'); return false; }
        if (form.apellidos.trim().length < 2) { setError('Los apellidos deben tener al menos 2 caracteres'); return false; }
        if (!trabajador?.tiene_asignaciones_activas && !form.identificacion.trim()) {
            setError('El campo Identificación es obligatorio'); return false;
        }
        if (!trabajador?.tiene_asignaciones_activas && form.identificacion.length < 6) {
            setError('La identificación debe tener entre 6 y 10 dígitos'); return false;
        }
        if (!form.telefono.trim()) { setError('El campo Teléfono es obligatorio'); return false; }
        if (form.telefono.length !== 10) { setError('El teléfono debe tener exactamente 10 dígitos'); return false; }
        if (!form.rol) { setError('Debes seleccionar un Rol'); return false; }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const payload: Partial<EditForm> = {
                nombres: form.nombres.trim(),
                apellidos: form.apellidos.trim(),
                telefono: form.telefono.trim(),
                rol: form.rol,
            };
            // Solo incluir identificacion si no tiene asignaciones activas
            if (!trabajador?.tiene_asignaciones_activas) {
                payload.identificacion = form.identificacion.trim();
            }
            const updated = await updatePersonal(id, payload);
            setTrabajador(updated);
            setEditMode(false);
            setSuccessMsg(
                `Perfil actualizado el ${formatDate(updated.fecha_modificacion)}`
            );
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (detail === 'La identificación ya está registrada') {
                setError('Esa identificación ya está registrada por otro trabajador.');
            } else {
                setError('Error al guardar los cambios. Intenta de nuevo.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        if (trabajador) {
            setForm({
                nombres: trabajador.nombres,
                apellidos: trabajador.apellidos,
                identificacion: trabajador.identificacion,
                telefono: trabajador.telefono,
                rol: trabajador.rol,
            });
        }
        setEditMode(false);
        setError(null);
    };

    if (loading) {
        return (
            <View style={[styles.fullCenter, { backgroundColor: colors.surface }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
                    Cargando perfil...
                </Text>
            </View>
        );
    }

    if (error && !trabajador) {
        return (
            <View style={[styles.fullCenter, { backgroundColor: colors.surface }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <MaterialCommunityIcons name="alert-circle-outline" size={52} color={colors.error} />
                <Text style={[styles.stateText, { color: colors.error }]}>{error}</Text>
                <Button title="Reintentar" onPress={loadTrabajador} variant="primary" />
                <Button title="Volver" onPress={() => router.back()} variant="outlined" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
                        {trabajador?.nombres} {trabajador?.apellidos}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                        C.C. {trabajador?.identificacion}
                    </Text>
                </View>
                {!editMode && (
                    <TouchableOpacity
                        onPress={() => { setEditMode(true); setSuccessMsg(null); }}
                        style={[styles.editBtn, { backgroundColor: colors.secondaryContainer }]}>
                        <MaterialCommunityIcons
                            name="pencil-outline"
                            size={18}
                            color={colors.onSecondaryContainer}
                        />
                        <Text style={[styles.editBtnText, { color: colors.onSecondaryContainer }]}>
                            Editar
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Banner de éxito */}
            {successMsg && (
                <View
                    style={[
                        styles.banner,
                        { borderColor: colors.success, backgroundColor: colors.success + '15' },
                    ]}>
                    <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                    <Text style={[styles.bannerText, { color: colors.success }]}>{successMsg}</Text>
                </View>
            )}

            {/* Banner de error */}
            {error && (
                <View
                    style={[
                        styles.banner,
                        { borderColor: colors.error, backgroundColor: colors.error + '15' },
                    ]}>
                    <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
                    <Text style={[styles.bannerText, { color: colors.error }]}>{error}</Text>
                </View>
            )}

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>

                {/* Tarjeta de datos personales */}
                <Card variant="elevated" style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                        Datos personales
                    </Text>

                    {editMode ? (
                        <>
                            {/* Nombres editable */}
                            <View style={styles.fieldContainer}>
                                <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
                                    Nombres
                                </Text>
                                <View style={[styles.inputContainer, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
                                    <MaterialCommunityIcons name="account-outline" size={16} color={colors.secondary} />
                                    <TextInput
                                        style={[styles.textInput, { color: colors.onSurface }]}
                                        value={form.nombres}
                                        onChangeText={(v) => handleChange('nombres', v)}
                                        placeholder="Nombres"
                                        placeholderTextColor={colors.onSurfaceVariant}
                                    />
                                </View>
                            </View>

                            {/* Apellidos editable */}
                            <View style={styles.fieldContainer}>
                                <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
                                    Apellidos
                                </Text>
                                <View style={[styles.inputContainer, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
                                    <MaterialCommunityIcons name="account-outline" size={16} color={colors.secondary} />
                                    <TextInput
                                        style={[styles.textInput, { color: colors.onSurface }]}
                                        value={form.apellidos}
                                        onChangeText={(v) => handleChange('apellidos', v)}
                                        placeholder="Apellidos"
                                        placeholderTextColor={colors.onSurfaceVariant}
                                    />
                                </View>
                            </View>

                            {/* Identificación - bloqueada si tiene asignaciones */}
                            <View style={styles.fieldContainer}>
                                <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
                                    Número de identificación
                                </Text>
                                {trabajador?.tiene_asignaciones_activas ? (
                                    <>
                                        <View
                                            style={[
                                                styles.inputContainer,
                                                {
                                                    borderColor: colors.outlineVariant,
                                                    backgroundColor: colors.surfaceContainerLow,
                                                    opacity: 0.6,
                                                },
                                            ]}>
                                            <MaterialCommunityIcons
                                                name="lock-outline"
                                                size={16}
                                                color={colors.onSurfaceVariant}
                                            />
                                            <Text style={[styles.textInput, { color: colors.onSurfaceVariant }]}>
                                                {form.identificacion}
                                            </Text>
                                        </View>
                                        <View style={[styles.infoChip, { backgroundColor: colors.surfaceContainerLow }]}>
                                            <MaterialCommunityIcons
                                                name="information-outline"
                                                size={14}
                                                color={colors.onSurfaceVariant}
                                            />
                                            <Text style={[styles.infoChipText, { color: colors.onSurfaceVariant }]}>
                                                No puede cambiarse mientras existan asignaciones activas
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    <View style={[styles.inputContainer, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
                                        <MaterialCommunityIcons
                                            name="card-account-details-outline"
                                            size={16}
                                            color={colors.secondary}
                                        />
                                        <TextInput
                                            style={[styles.textInput, { color: colors.onSurface }]}
                                            value={form.identificacion}
                                            onChangeText={(v) => handleChange('identificacion', v)}
                                            keyboardType="numeric"
                                            placeholder="Identificación"
                                            placeholderTextColor={colors.onSurfaceVariant}
                                        />
                                    </View>
                                )}
                            </View>
                        </>
                    ) : (
                        <>
                            <InfoRow icon="account-outline" label="Nombres" value={trabajador?.nombres} colors={colors} />
                            <InfoRow icon="account-outline" label="Apellidos" value={trabajador?.apellidos} colors={colors} />
                            <InfoRow icon="card-account-details-outline" label="Identificación" value={trabajador?.identificacion} colors={colors} />
                        </>
                    )}
                </Card>

                {/* Tarjeta de contacto y rol */}
                <Card variant="elevated" style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                        Contacto y rol
                    </Text>

                    {editMode ? (
                        <>
                            {/* Teléfono editable */}
                            <View style={styles.fieldContainer}>
                                <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
                                    Teléfono
                                </Text>
                                <View style={[styles.inputContainer, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
                                    <MaterialCommunityIcons name="phone-outline" size={16} color={colors.secondary} />
                                    <TextInput
                                        style={[styles.textInput, { color: colors.onSurface }]}
                                        value={form.telefono}
                                        onChangeText={(v) => handleChange('telefono', v)}
                                        keyboardType="phone-pad"
                                        placeholder="Teléfono"
                                        placeholderTextColor={colors.onSurfaceVariant}
                                    />
                                </View>
                            </View>

                            {/* Rol editable */}
                            <PickerField
                                label="Rol"
                                value={form.rol}
                                options={ROLES}
                                onSelect={(v) => handleChange('rol', v)}
                                icon="briefcase-outline"
                                colors={colors}
                                storageKey="custom_rol"
                            />
                        </>
                    ) : (
                        <>
                            <InfoRow icon="phone-outline" label="Teléfono" value={trabajador?.telefono} colors={colors} />
                            <InfoRow icon="briefcase-outline" label="Rol" value={trabajador?.rol} colors={colors} />
                        </>
                    )}
                </Card>

                {/* Tarjeta de auditoría */}
                <Card variant="outlined" style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                        Registro de modificaciones
                    </Text>
                    <InfoRow
                        icon="calendar-plus"
                        label="Fecha de registro"
                        value={formatDate(trabajador?.fecha_creacion ?? '')}
                        colors={colors}
                    />
                    <InfoRow
                        icon="calendar-edit"
                        label="Última modificación"
                        value={formatDate(trabajador?.fecha_modificacion ?? '')}
                        colors={colors}
                    />
                </Card>
            </ScrollView>

            {/* Footer en modo edición */}
            {editMode && (
                <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
                    <Button
                        title="Cancelar"
                        onPress={handleCancelEdit}
                        variant="outlined"
                        style={styles.footerBtn}
                        disabled={saving}
                    />
                    <Button
                        title={saving ? 'Guardando...' : 'Guardar cambios'}
                        onPress={handleSave}
                        variant="primary"
                        style={styles.footerBtn}
                        disabled={saving}
                    />
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

function InfoRow({
    icon,
    label,
    value,
    colors,
}: {
    icon: string;
    label: string;
    value?: string;
    colors: any;
}) {
    return (
        <View style={styles.infoRow}>
            <MaterialCommunityIcons name={icon as any} size={16} color={colors.secondary} />
            <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.onSurface }]} numberOfLines={2}>
                {value ?? '—'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    fullCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.xl,
    },
    stateText: { ...Typography.bodyLarge, textAlign: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: { padding: Spacing.xs },
    title: { ...Typography.headlineMedium, marginBottom: 2 },
    subtitle: { ...Typography.labelMedium },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    editBtnText: { ...Typography.labelLarge },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
    },
    bannerText: { ...Typography.bodyMedium, fontWeight: '500', flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
    section: {},
    sectionTitle: { ...Typography.labelLarge, fontWeight: '600', marginBottom: Spacing.lg },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    infoLabel: { ...Typography.labelMedium, minWidth: 120 },
    infoValue: { ...Typography.bodyMedium, fontWeight: '500', flex: 1 },
    fieldContainer: { marginBottom: Spacing.md },
    fieldLabel: { ...Typography.labelMedium, marginBottom: Spacing.sm },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    textInput: { flex: 1, ...Typography.bodyMedium },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    pickerText: { flex: 1, ...Typography.bodyMedium },
    dropdown: { marginTop: Spacing.sm },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
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
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: Spacing.sm,
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    infoChipText: { ...Typography.labelSmall, flex: 1 },
    footer: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderTopWidth: 1,
    },
    footerBtn: { flex: 1 },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
