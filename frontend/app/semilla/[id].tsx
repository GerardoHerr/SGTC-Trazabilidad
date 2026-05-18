import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet,
    Text, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button, Card } from '@/components';
import * as DocumentPicker from 'expo-document-picker';
import { getSemillaById, updateSemillaAnexo, deleteAnexoSemilla } from '@/services/semilla_service';
import Config from '@/constants/Config';

const ALLOWED_EXTENSIONS = ['.pdf', '.csv', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface FileData {
    uri: string;
    name: string;
    size: number;
    mimeType?: string;
}

const getFileIcon = (name: string): any => {
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    if (ext === '.pdf') return 'file-pdf-box';
    if (ext === '.csv') return 'file-csv';
    if (['.jpg', '.jpeg', '.png'].includes(ext)) return 'file-image';
    return 'file';
};

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value?: string; colors: any }) {
    return (
        <View style={s.infoRow}>
            <MaterialCommunityIcons name={icon as any} size={15} color={colors.secondary} />
            <Text style={[s.infoLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            <Text style={[s.infoValue, { color: colors.onSurface }]}>{value || 'No especificado'}</Text>
        </View>
    );
}

export default function EditarSemilla() {
    const cs = useColorScheme();
    const c = Colors[cs ?? 'light'];
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const semillaId = Array.isArray(id) ? id[0] : id;

    const [semilla, setSemilla] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [nuevoAnexo, setNuevoAnexo] = useState<FileData | null>(null);

    useEffect(() => { cargar(); }, [semillaId]);

    const cargar = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSemillaById(semillaId);
            setSemilla(data);
        } catch {
            setError('No se pudo cargar la semilla.');
        } finally {
            setLoading(false);
        }
    };

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
                setNuevoAnexo({ uri: file.uri, name: file.name, size: file.size ?? 0, mimeType: file.mimeType });
                setError(null);
            }
        } catch {
            setError('Error al seleccionar el archivo.');
        }
    };

    const handleGuardar = async () => {
        if (!nuevoAnexo) { setError('Selecciona un archivo primero.'); return; }
        setSaving(true);
        setError(null);
        try {
            const updated = await updateSemillaAnexo(semillaId, nuevoAnexo);
            setSemilla(updated);
            setNuevoAnexo(null);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? 'Error al actualizar el archivo.');
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!semilla?.anexo_nombre) return;
        const url = `${Config.API_URL}/semillas/${semillaId}/anexo`;
        try {
            if (Platform.OS === 'web') {
                const response = await fetch(url);
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = objectUrl;
                link.download = semilla.anexo_nombre;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(objectUrl);
            } else {
                // En móvil, abre el URL en el navegador del sistema
                await Linking.openURL(url);
            }
        } catch {
            setError('Error al descargar el archivo.');
        }
    };

    const ejecutarEliminacion = async () => {
        setDeleting(true);
        setError(null);
        try {
            await deleteAnexoSemilla(semillaId);
            setSemilla((prev: any) => ({ ...prev, anexo_nombre: null, anexo_ruta: null, anexo_tamano: null }));
            setNuevoAnexo(null);
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? 'Error al eliminar el archivo.');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteAnexo = () => setShowDeleteModal(true);

    if (loading) {
        return (
            <View style={[s.center, { backgroundColor: c.surface }]}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    if (!semilla) {
        return (
            <View style={[s.center, { backgroundColor: c.surface }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={c.error} />
                <Text style={{ color: c.error, marginTop: 12 }}>{error ?? 'Semilla no encontrada'}</Text>
                <Button title="Volver" onPress={() => router.back()} variant="outlined" />
            </View>
        );
    }

    return (
        <View style={[s.container, { backgroundColor: c.background }]}>
            {/* Header */}
            <View style={[s.header, { borderBottomColor: c.outlineVariant, backgroundColor: c.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={c.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[s.title, { color: c.onSurface }]}>Editar Semilla</Text>
                    <Text style={[s.sub, { color: c.onSurfaceVariant }]}>{semilla.variedad}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: c.secondaryContainer }]}>
                    <MaterialCommunityIcons name="leaf" size={14} color={c.onSecondaryContainer} />
                    <Text style={[s.badgeText, { color: c.onSecondaryContainer }]}>Semilla</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={s.scroll}>
                {/* Banners */}
                {error && (
                    <View style={[s.banner, { borderColor: c.error, backgroundColor: c.error + '15' }]}>
                        <MaterialCommunityIcons name="alert-circle" size={16} color={c.error} />
                        <Text style={[s.bannerText, { color: c.error }]}>{error}</Text>
                    </View>
                )}
                {success && (
                    <View style={[s.banner, { borderColor: c.success, backgroundColor: c.success + '15' }]}>
                        <MaterialCommunityIcons name="check-circle" size={16} color={c.success} />
                        <Text style={[s.bannerText, { color: c.success }]}>Archivo actualizado correctamente</Text>
                    </View>
                )}

                {/* Info de la semilla (solo lectura) */}
                <Card variant="elevated" style={s.card}>
                    <Text style={[s.sectionTitle, { color: c.onSurface }]}>Información</Text>
                    <InfoRow icon="leaf" label="Variedad" value={semilla.variedad} colors={c} />
                    <InfoRow icon="map-marker" label="Origen" value={semilla.origen} colors={c} />
                    {semilla.distribuidor && (
                        <InfoRow icon="truck-delivery-outline" label="Distribuidor" value={semilla.distribuidor} colors={c} />
                    )}
                    <InfoRow icon="calendar" label="Fecha de registro" value={
                        semilla.fecha_creacion
                            ? new Date(semilla.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                            : undefined
                    } colors={c} />
                </Card>

                {/* Archivo adjunto actual */}
                <Card variant="elevated" style={s.card}>
                    <Text style={[s.sectionTitle, { color: c.onSurface }]}>Documento adjunto</Text>

                    {semilla.anexo_nombre ? (
                        <>
                            <View style={[s.fileCard, { backgroundColor: c.primaryContainer + '30', borderColor: c.outlineVariant }]}>
                                <MaterialCommunityIcons name={getFileIcon(semilla.anexo_nombre)} size={28} color={c.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[s.fileName, { color: c.onSurface }]} numberOfLines={1}>
                                        {semilla.anexo_nombre}
                                    </Text>
                                    {semilla.anexo_tamano && (
                                        <Text style={[s.fileSize, { color: c.onSurfaceVariant }]}>
                                            {(semilla.anexo_tamano / 1024).toFixed(1)} KB
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity onPress={handleDownload} style={[s.downloadBtn, { backgroundColor: c.primary }]}>
                                    <MaterialCommunityIcons name="download" size={18} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleDeleteAnexo}
                                    disabled={deleting}
                                    style={[s.downloadBtn, { backgroundColor: '#fca5a5' }]}>
                                    {deleting
                                        ? <ActivityIndicator size={14} color="#fff" />
                                        : <MaterialCommunityIcons name="trash-can-outline" size={18} color="#fff" />
                                    }
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={[s.emptyFile, { borderColor: c.outlineVariant }]}>
                            <MaterialCommunityIcons name="file-remove-outline" size={32} color={c.onSurfaceVariant} />
                            <Text style={{ color: c.onSurfaceVariant, marginTop: 6 }}>Sin archivo adjunto</Text>
                        </View>
                    )}

                    {/* Nuevo archivo seleccionado */}
                    {nuevoAnexo && (
                        <View style={[s.fileCard, { backgroundColor: c.success + '10', borderColor: c.success }]}>
                            <MaterialCommunityIcons name={getFileIcon(nuevoAnexo.name)} size={28} color={c.success} />
                            <View style={{ flex: 1 }}>
                                <Text style={[s.fileName, { color: c.onSurface }]} numberOfLines={1}>
                                    {nuevoAnexo.name}
                                </Text>
                                <Text style={[s.fileSize, { color: c.onSurfaceVariant }]}>
                                    {(nuevoAnexo.size / 1024).toFixed(1)} KB · Nuevo
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setNuevoAnexo(null)}>
                                <MaterialCommunityIcons name="close-circle" size={22} color={c.error} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[s.pickBtn, { borderColor: c.secondary, backgroundColor: c.secondaryContainer + '20' }]}
                        onPress={handleSelectFile}>
                        <MaterialCommunityIcons name="cloud-upload-outline" size={20} color={c.secondary} />
                        <Text style={[s.pickBtnText, { color: c.secondary }]}>
                            {nuevoAnexo ? 'Cambiar archivo' : 'Seleccionar archivo'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={[s.hint, { color: c.onSurfaceVariant }]}>PDF, CSV, JPG o PNG — máx. 5 MB</Text>
                </Card>

                <View style={{ height: 24 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[s.footer, { borderTopColor: c.outlineVariant, backgroundColor: c.surface }]}>
                <Button title="Cancelar" onPress={() => router.back()} variant="outlined" style={{ flex: 1 }} disabled={saving} />
                <Button
                    title={saving ? 'Guardando...' : 'Guardar cambios'}
                    onPress={handleGuardar}
                    variant="primary"
                    style={{ flex: 1 }}
                    disabled={saving || !nuevoAnexo}
                />
            </View>

            {saving && (
                <View style={s.overlay}>
                    <ActivityIndicator size="large" color={c.primary} />
                </View>
            )}

            {/* Modal de confirmación para eliminar */}
            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}>
                <Pressable style={s.modalBackdrop} onPress={() => setShowDeleteModal(false)}>
                    <Pressable style={[s.modalBox, { backgroundColor: c.surface }]} onPress={() => {}}>
                        <MaterialCommunityIcons name="trash-can-outline" size={32} color={c.error} />
                        <Text style={[s.modalTitle, { color: c.onSurface }]}>Eliminar archivo</Text>
                        <Text style={[s.modalMsg, { color: c.onSurfaceVariant }]}>
                            ¿Estás seguro de que deseas eliminar el archivo adjunto? Esta acción no se puede deshacer.
                        </Text>
                        <View style={s.modalBtns}>
                            <TouchableOpacity
                                style={[s.modalBtn, { borderWidth: 1, borderColor: c.outlineVariant }]}
                                onPress={() => setShowDeleteModal(false)}>
                                <Text style={[s.modalBtnText, { color: c.onSurface }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.modalBtn, { backgroundColor: '#f87171' }]}
                                onPress={() => { setShowDeleteModal(false); ejecutarEliminacion(); }}>
                                <Text style={[s.modalBtnText, { color: '#fff' }]}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1,
    },
    backBtn: { padding: Spacing.xs },
    title: { fontSize: 18, fontWeight: '700' },
    sub: { fontSize: 12 },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: Spacing.sm, paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    badgeText: { fontSize: 12, fontWeight: '600' },
    scroll: { padding: Spacing.md, gap: Spacing.md },
    card: { marginBottom: 0 },
    sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: Spacing.md },
    banner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.sm,
    },
    bannerText: { flex: 1, fontSize: 13 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    infoLabel: { fontSize: 12, minWidth: 90 },
    infoValue: { fontSize: 13, fontWeight: '600', flex: 1 },
    fileCard: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm,
    },
    fileName: { fontSize: 13, fontWeight: '600' },
    fileSize: { fontSize: 11, marginTop: 2 },
    downloadBtn: { padding: Spacing.sm, borderRadius: BorderRadius.md },
    emptyFile: {
        alignItems: 'center', padding: Spacing.lg,
        borderWidth: 1, borderRadius: BorderRadius.md, borderStyle: 'dashed',
        marginBottom: Spacing.sm,
    },
    pickBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1.5, borderStyle: 'dashed', borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md, marginBottom: Spacing.xs,
    },
    pickBtnText: { fontSize: 14, fontWeight: '600' },
    hint: { fontSize: 11, textAlign: 'center' },
    footer: {
        flexDirection: 'row', gap: Spacing.md,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
        padding: Spacing.xl,
    },
    modalBox: {
        width: '100%', maxWidth: 360,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center', gap: Spacing.sm,
        shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
    },
    modalTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
    modalMsg: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.sm },
    modalBtns: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
    modalBtn: {
        flex: 1, paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg, alignItems: 'center',
    },
    modalBtnText: { fontSize: 14, fontWeight: '700' },
});
