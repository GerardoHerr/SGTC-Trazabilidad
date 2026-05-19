import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button, Card } from '@/components';
import { getParcelaById } from '@/services/parcela_service';
import { crearLotes, listarLotes } from '@/services/lote_service';

export default function AgregarLotes() {
    const cs = useColorScheme();
    const c = Colors[cs ?? 'light'];
    const router = useRouter();
    const { parcelaId: parcelaIdParam } = useLocalSearchParams();
    const parcelaId = Array.isArray(parcelaIdParam) ? parcelaIdParam[0] : parcelaIdParam ?? '';

    const [parcela, setParcela] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hectareasUsadas, setHectareasUsadas] = useState(0);

    // Para parcelas REGULARES
    const [cantidadLotes, setCantidadLotes] = useState('1');
    const [distribuciones, setDistribuciones] = useState<any[]>([]);

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
            const [dataParcela, lotesExistentes] = await Promise.all([
                getParcelaById(parseInt(parcelaId as string)),
                (listarLotes as any)(parseInt(parcelaId)),
            ]);
            setParcela(dataParcela);
            const usadas = lotesExistentes.reduce((sum: number, l: any) => sum + (l.hectareas_asignadas || 0), 0);
            setHectareasUsadas(usadas);

            // Si es irregular, auto-generar distribuciones desde zonas_hectareas
            if (dataParcela.tipo_terreno === 'Irregular' && dataParcela.zonas_hectareas) {
                const dist = Object.entries(dataParcela.zonas_hectareas).map(([zona, ha], i) => ({
                    numero_lote: i + 1,
                    hectareas: ha as number,
                    tipo_zona: zona,
                }));
                setDistribuciones(dist);
            } else {
                calcularDistribucionRegular(dataParcela, 1);
            }
        } catch {
            setError('Error al cargar los datos de la parcela.');
        } finally {
            setLoading(false);
        }
    };

    const calcularDistribucionRegular = (p: any, cantidad: number) => {
        if (!p || cantidad < 1) { setDistribuciones([]); return; }
        const disponibles = Math.max(0, p.hectareas - hectareasUsadas);
        if (disponibles <= 0) { setDistribuciones([]); return; }
        const ha = Math.round((disponibles / cantidad + Number.EPSILON) * 100) / 100;
        setDistribuciones(
            Array.from({ length: cantidad }, (_, i) => ({
                numero_lote: i + 1,
                hectareas: ha,
                tipo_zona: null,
            }))
        );
    };

    const handleCantidadChange = (text: string) => {
        setCantidadLotes(text);
        const n = parseInt(text) || 0;
        const disponibles = parcela ? parcela.hectareas - hectareasUsadas : 0;
        if (disponibles <= 0) { setDistribuciones([]); return; }
        if (n > 0 && parcela) calcularDistribucionRegular(parcela, n);
        else setDistribuciones([]);
    };

    const handleHectareasChange = (index: number, valor: string) => {
        const nuevas = [...distribuciones];
        nuevas[index] = { ...nuevas[index], hectareas: parseFloat(valor) || 0 };
        setDistribuciones(nuevas);
    };

    const validar = (): boolean => {
        setError('');
        const disponibles = parcela.hectareas - hectareasUsadas;

        if (disponibles <= 0) {
            setError('Esta parcela no tiene espacio disponible. Todas las hectáreas ya están asignadas a lotes existentes.');
            return false;
        }
        if (distribuciones.length === 0) {
            setError('No hay lotes para crear. Ingresa una cantidad válida.');
            return false;
        }

        if (parcela.tipo_terreno === 'Regular') {
            const n = parseInt(cantidadLotes);
            if (n < 1) { setError('La cantidad de lotes debe ser mayor a 0.'); return false; }

            // Mínimo 1 ha por lote
            for (let i = 0; i < distribuciones.length; i++) {
                if (distribuciones[i].hectareas < 1) {
                    setError(`El lote ${i + 1} tiene ${distribuciones[i].hectareas} ha. Cada lote debe tener al menos 1 hectárea.`);
                    return false;
                }
            }
        }

        const totalHa = distribuciones.reduce((s, d) => s + d.hectareas, 0);
        if (totalHa > disponibles + 0.001) {
            setError(`Las hectáreas asignadas (${totalHa.toFixed(2)} ha) superan el espacio disponible (${disponibles.toFixed(2)} ha).`);
            return false;
        }
        return true;
    };

    const handleGuardar = async () => {
        if (!validar()) return;
        setSaving(true);
        try {
            await crearLotes({
                parcela_id: parseInt(parcelaId as string),
                cantidad_lotes: distribuciones.length,
                distribuciones,
            });
            setSuccess('Lotes creados correctamente');
            setTimeout(() => router.back(), 1500);
        } catch (err: any) {
            setError(err?.response?.data?.detail ?? 'Error al crear los lotes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[st.center, { backgroundColor: c.surface }]}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    if (!parcela) {
        return (
            <View style={[st.center, { backgroundColor: c.surface }]}>
                <Text style={{ color: c.error }}>Parcela no encontrada.</Text>
            </View>
        );
    }

    const isIrregular = parcela.tipo_terreno === 'Irregular';
    const disponibles = parcela.hectareas - hectareasUsadas;
    const sinEspacio = disponibles <= 0;
    const totalNuevo = distribuciones.reduce((s, d) => s + d.hectareas, 0);

    return (
        <View style={[st.container, { backgroundColor: c.background }]}>
            {/* Header */}
            <View style={[st.header, { borderBottomColor: c.outlineVariant, backgroundColor: c.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={c.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[st.title, { color: c.onSurface }]}>Crear Lotes</Text>
                    <Text style={[st.sub, { color: c.onSurfaceVariant }]}>
                        Parcela {parcela.codigo} · {parcela.tipo_terreno}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={st.scroll}>
                {/* Banners */}
                {sinEspacio && (
                    <View style={[st.banner, { borderColor: '#f59e0b', backgroundColor: '#f59e0b15' }]}>
                        <MaterialCommunityIcons name="alert" size={16} color="#f59e0b" />
                        <Text style={{ flex: 1, color: '#f59e0b', fontSize: 13 }}>
                            Esta parcela no tiene espacio disponible. Todas las hectáreas ya están asignadas.
                        </Text>
                    </View>
                )}
                {error !== '' && (
                    <View style={[st.banner, { borderColor: c.error, backgroundColor: c.error + '15' }]}>
                        <MaterialCommunityIcons name="alert-circle" size={16} color={c.error} />
                        <Text style={{ flex: 1, color: c.error, fontSize: 13 }}>{error}</Text>
                    </View>
                )}
                {success !== '' && (
                    <View style={[st.banner, { borderColor: c.success, backgroundColor: c.success + '15' }]}>
                        <MaterialCommunityIcons name="check-circle" size={16} color={c.success} />
                        <Text style={{ flex: 1, color: c.success, fontSize: 13 }}>{success}</Text>
                    </View>
                )}

                {/* Disponibilidad */}
                <Card variant="elevated" style={st.card}>
                    <Text style={[st.sectionTitle, { color: c.onSurface }]}>Espacio disponible</Text>
                    <View style={st.haRow}>
                        <View style={st.haCell}>
                            <Text style={[st.haNum, { color: c.primary }]}>{parcela.hectareas} ha</Text>
                            <Text style={[st.haLbl, { color: c.onSurfaceVariant }]}>Total parcela</Text>
                        </View>
                        <View style={st.haCell}>
                            <Text style={[st.haNum, { color: c.error }]}>{hectareasUsadas.toFixed(2)} ha</Text>
                            <Text style={[st.haLbl, { color: c.onSurfaceVariant }]}>Ocupadas</Text>
                        </View>
                        <View style={st.haCell}>
                            <Text style={[st.haNum, { color: c.success }]}>{disponibles.toFixed(2)} ha</Text>
                            <Text style={[st.haLbl, { color: c.onSurfaceVariant }]}>Disponibles</Text>
                        </View>
                    </View>
                </Card>

                {/* REGULAR: input cantidad + distribución editable */}
                {!isIrregular && (
                    <Card variant="elevated" style={st.card}>
                        <Text style={[st.sectionTitle, { color: c.onSurface }]}>Cantidad de lotes</Text>
                        <View style={[st.inputRow, { borderColor: c.outlineVariant, backgroundColor: c.surfaceContainerLow }]}>
                            <MaterialCommunityIcons name="numeric" size={17} color={c.secondary} />
                            <TextInput
                                style={[{ flex: 1, fontSize: 15, color: c.onSurface }]}
                                placeholder="Ej: 3"
                                keyboardType="numeric"
                                value={cantidadLotes}
                                onChangeText={handleCantidadChange}
                                placeholderTextColor={c.onSurfaceVariant}
                            />
                        </View>
                    </Card>
                )}

                {/* IRREGULAR: info de auto-distribución */}
                {isIrregular && (
                    <Card variant="elevated" style={st.card}>
                        <View style={st.infoRow}>
                            <MaterialCommunityIcons name="information-outline" size={16} color={c.primary} />
                            <Text style={[st.infoText, { color: c.onSurface }]}>
                                Se creará un lote por cada zona registrada en la parcela. Las hectáreas ya están definidas.
                            </Text>
                        </View>
                    </Card>
                )}

                {/* Distribución */}
                {distribuciones.length > 0 && (
                    <Card variant="elevated" style={st.card}>
                        <Text style={[st.sectionTitle, { color: c.onSurface }]}>
                            {isIrregular ? 'Lotes a crear' : 'Distribución de hectáreas'}
                        </Text>
                        {distribuciones.map((dist, idx) => (
                            <View key={idx} style={[st.loteRow, { borderColor: c.outlineVariant }]}>
                                <View style={[st.loteNum, { backgroundColor: c.primaryContainer }]}>
                                    <Text style={[st.loteNumText, { color: c.primary }]}>{idx + 1}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    {dist.tipo_zona && (
                                        <Text style={[st.zonaTag, { color: c.secondary }]}>{dist.tipo_zona}</Text>
                                    )}
                                    {isIrregular ? (
                                        <Text style={[st.haFixed, { color: c.onSurface }]}>{dist.hectareas} ha</Text>
                                    ) : (
                                        <View style={[st.haInputRow, { borderColor: c.outlineVariant, backgroundColor: c.surfaceContainerLow }]}>
                                            <TextInput
                                                style={{ flex: 1, fontSize: 14, color: c.onSurface }}
                                                keyboardType="decimal-pad"
                                                value={dist.hectareas.toString()}
                                                onChangeText={(v) => handleHectareasChange(idx, v)}
                                                placeholderTextColor={c.onSurfaceVariant}
                                            />
                                            <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>ha</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}

                        {/* Resumen */}
                        <View style={[st.resumen, { borderTopColor: c.outlineVariant }]}>
                            <Text style={[st.resumenLabel, { color: c.onSurfaceVariant }]}>Nuevo total asignado:</Text>
                            <Text style={[st.resumenVal, {
                                color: totalNuevo > disponibles + 0.001 ? c.error : c.success,
                            }]}>
                                {totalNuevo.toFixed(2)} / {disponibles.toFixed(2)} ha
                            </Text>
                        </View>
                    </Card>
                )}

                <View style={{ height: 24 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[st.footer, { borderTopColor: c.outlineVariant, backgroundColor: c.surface }]}>
                <Button title="Cancelar" onPress={() => router.back()} variant="outlined" style={{ flex: 1 }} disabled={saving} />
                <Button
                    title={saving ? 'Guardando...' : 'Crear Lotes'}
                    onPress={handleGuardar}
                    variant="primary"
                    style={{ flex: 1 }}
                    disabled={saving || sinEspacio || distribuciones.length === 0}
                />
            </View>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1,
    },
    backBtn: { padding: Spacing.xs },
    title: { fontSize: 18, fontWeight: '700' },
    sub: { fontSize: 12 },
    scroll: { padding: Spacing.md, gap: Spacing.md },
    card: { marginBottom: 0 },
    sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: Spacing.md },
    banner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.sm,
    },
    haRow: { flexDirection: 'row', justifyContent: 'space-around' },
    haCell: { alignItems: 'center' },
    haNum: { fontSize: 18, fontWeight: '700' },
    haLbl: { fontSize: 11 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    infoText: { flex: 1, fontSize: 13 },
    loteRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        borderWidth: 1, borderRadius: BorderRadius.md,
        padding: Spacing.sm, marginBottom: Spacing.sm,
    },
    loteNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    loteNumText: { fontSize: 13, fontWeight: '700' },
    zonaTag: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    haFixed: { fontSize: 15, fontWeight: '600' },
    haInputRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm, paddingVertical: 6,
    },
    resumen: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, paddingTop: Spacing.sm, marginTop: Spacing.sm,
    },
    resumenLabel: { fontSize: 13 },
    resumenVal: { fontSize: 14, fontWeight: '700' },
    footer: {
        flexDirection: 'row', gap: Spacing.md,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderTopWidth: 1,
    },
});
