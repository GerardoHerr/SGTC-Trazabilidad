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
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button, Card } from '@/components';
import { createPersonal } from '@/services/personal_service';

const ROLES = ['Recolector', 'Fumigador', 'Operario', 'Supervisor', 'Capataz'];

interface FormState {
    nombres: string;
    apellidos: string;
    identificacion: string;
    telefono: string;
    rol: string;
}

interface PickerFieldProps {
    label: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    icon: string;
    colors: any;
}

function PickerField({ label, value, options, onSelect, icon, colors }: PickerFieldProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
            <TouchableOpacity
                style={[
                    styles.pickerButton,
                    { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow },
                ]}
                onPress={() => setIsOpen(!isOpen)}
                activeOpacity={0.7}>
                <MaterialCommunityIcons name={icon as any} size={18} color={colors.secondary} />
                <Text
                    style={[
                        styles.pickerText,
                        { color: value ? colors.onSurface : colors.onSurfaceVariant },
                    ]}>
                    {value || `Seleccionar ${label.toLowerCase()}`}
                </Text>
                <MaterialCommunityIcons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.onSurfaceVariant}
                />
            </TouchableOpacity>
            {isOpen && (
                <Card variant="filled" style={styles.dropdown}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.dropdownItem,
                                { borderBottomColor: colors.outlineVariant },
                                value === option && { backgroundColor: colors.primaryContainer },
                            ]}
                            onPress={() => {
                                onSelect(option);
                                setIsOpen(false);
                            }}>
                            <Text
                                style={[
                                    styles.dropdownItemText,
                                    {
                                        color:
                                            value === option
                                                ? colors.onPrimaryContainer
                                                : colors.onSurface,
                                    },
                                ]}>
                                {option}
                            </Text>
                            {value === option && (
                                <MaterialCommunityIcons
                                    name="check"
                                    size={18}
                                    color={colors.onPrimaryContainer}
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </Card>
            )}
        </View>
    );
}

interface TextFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: string;
    keyboardType?: 'default' | 'numeric' | 'phone-pad';
    colors: any;
}

function TextField({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    keyboardType = 'default',
    colors,
}: TextFieldProps) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
            <View
                style={[
                    styles.inputContainer,
                    { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow },
                ]}>
                <MaterialCommunityIcons name={icon as any} size={18} color={colors.secondary} />
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

export default function AgregarPersonal() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [form, setForm] = useState<FormState>({
        nombres: '',
        apellidos: '',
        identificacion: '',
        telefono: '',
        rol: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (field: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateForm = (): boolean => {
        if (!form.nombres.trim()) { setError('El campo Nombres es obligatorio'); return false; }
        if (!form.apellidos.trim()) { setError('El campo Apellidos es obligatorio'); return false; }
        if (!form.identificacion.trim()) { setError('El campo Identificación es obligatorio'); return false; }
        if (!form.telefono.trim()) { setError('El campo Teléfono es obligatorio'); return false; }
        if (!/^\d+$/.test(form.telefono)) { setError('El teléfono debe contener solo números'); return false; }
        if (!form.rol) { setError('Debes seleccionar un Rol'); return false; }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            setLoading(true);
            await createPersonal({
                nombres: form.nombres.trim(),
                apellidos: form.apellidos.trim(),
                identificacion: form.identificacion.trim(),
                telefono: form.telefono.trim(),
                rol: form.rol,
            });
            setSuccess(true);
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (detail === 'La identificación ya está registrada') {
                setError('Esa identificación ya está registrada. Usa una diferente.');
            } else {
                setError('Error al guardar el trabajador. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => router.back(), 1800);
            return () => clearTimeout(timer);
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
                    <Text style={[styles.title, { color: colors.onSurface }]}>
                        Nuevo Trabajador
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                        Completa todos los campos obligatorios
                    </Text>
                </View>
            </View>

            {/* Banner de error */}
            {error && (
                <View
                    style={[
                        styles.banner,
                        { borderColor: colors.error, backgroundColor: colors.error + '15' },
                    ]}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                    <Text style={[styles.bannerText, { color: colors.error }]}>{error}</Text>
                </View>
            )}

            {/* Banner de éxito */}
            {success && (
                <View
                    style={[
                        styles.banner,
                        { borderColor: colors.success, backgroundColor: colors.success + '15' },
                    ]}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                    <Text style={[styles.bannerText, { color: colors.success }]}>
                        ¡Trabajador registrado exitosamente!
                    </Text>
                </View>
            )}

            {/* Formulario */}
            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>
                <Card variant="elevated">
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                        Datos personales
                    </Text>

                    <TextField
                        label="Nombres *"
                        value={form.nombres}
                        onChangeText={(v) => handleChange('nombres', v)}
                        placeholder="Ej: Juan Camilo"
                        icon="account-outline"
                        colors={colors}
                    />
                    <TextField
                        label="Apellidos *"
                        value={form.apellidos}
                        onChangeText={(v) => handleChange('apellidos', v)}
                        placeholder="Ej: Rodríguez García"
                        icon="account-outline"
                        colors={colors}
                    />
                    <TextField
                        label="Número de identificación *"
                        value={form.identificacion}
                        onChangeText={(v) => handleChange('identificacion', v)}
                        placeholder="Ej: 1234567890"
                        icon="card-account-details-outline"
                        keyboardType="numeric"
                        colors={colors}
                    />

                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.onSurface, marginTop: Spacing.lg },
                        ]}>
                        Contacto y rol
                    </Text>

                    <TextField
                        label="Número de teléfono *"
                        value={form.telefono}
                        onChangeText={(v) => handleChange('telefono', v)}
                        placeholder="Ej: 3001234567"
                        icon="phone-outline"
                        keyboardType="phone-pad"
                        colors={colors}
                    />
                    <PickerField
                        label="Rol *"
                        value={form.rol}
                        options={ROLES}
                        onSelect={(v) => handleChange('rol', v)}
                        icon="briefcase-outline"
                        colors={colors}
                    />
                </Card>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
                <Button
                    title="Cancelar"
                    onPress={() => router.back()}
                    variant="outlined"
                    style={styles.footerBtn}
                    disabled={loading}
                />
                <Button
                    title={loading ? 'Guardando...' : 'Guardar'}
                    onPress={handleSave}
                    variant="primary"
                    style={styles.footerBtn}
                    disabled={loading || success}
                />
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: { padding: Spacing.xs },
    title: { ...Typography.displaySmall, marginBottom: 2 },
    subtitle: { ...Typography.bodyMedium },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
    },
    bannerText: { ...Typography.bodyMedium, fontWeight: '500', flex: 1 },
    scroll: { flex: 1 },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    sectionTitle: { ...Typography.labelLarge, fontWeight: '600', marginBottom: Spacing.md },
    fieldContainer: { marginBottom: Spacing.lg },
    label: { ...Typography.labelLarge, marginBottom: Spacing.sm },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    textInput: { flex: 1, ...Typography.bodyMedium },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    pickerText: { flex: 1, ...Typography.bodyMedium },
    dropdown: { marginTop: Spacing.sm },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    dropdownItemText: { ...Typography.bodyMedium, flex: 1 },
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
