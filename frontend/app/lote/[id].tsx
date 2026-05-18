import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components';
import { obtenerLote } from '@/services/lote_service';
import { getSemillas } from '@/services/semilla_service';
import { getParcelaById } from '@/services/parcela_service';
import { getAgricultores, iniciarEtapa, getFasesLote } from '@/services/fase_service';

// ── Constantes de fases ────────────────────────────────────────────────────
const FASES_ORDEN = ['Sembrado','Cosecha','Despulpado','Secado','Tostado','Molido','Empaquetado','Transporte'];

// ── helpers ────────────────────────────────────────────────────────────────
const fmtFecha = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function InfoRow({ label, value }: { label: string; value: string }) {
    const cs = useColorScheme();
    const c = Colors[cs ?? 'light'];
    return (
        <View style={s.infoRow}>
            <Text style={[s.infoLabel, { color: c.onSurfaceVariant }]}>{label}</Text>
            <Text style={[s.infoValue, { color: c.onSurface }]}>{value}</Text>
        </View>
    );
}

function EstadoBadge({ estado }: { estado: string }) {
    const cs = useColorScheme();
    const c = Colors[cs ?? 'light'];
    const color =
        estado === 'Creado' ? '#f59e0b' :
        estado === 'En Producción' ? c.success :
        estado === 'En Proceso' ? c.secondary :
        estado === 'Completado' ? c.primary : c.onSurfaceVariant;
    return (
        <View style={[s.badge, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[s.badgeText, { color }]}>{estado}</Text>
        </View>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function DetalleLote() {
    const cs = useColorScheme();
    const c = Colors[cs ?? 'light'];
    const router = useRouter();
    const { id, parcelaId } = useLocalSearchParams();
    const loteId = parseInt(id as string);

    const [lote, setLote] = useState<any>(null);
    const [parcela, setParcela] = useState<any>(null);
    const [semillas, setSemillas] = useState<any[]>([]);
    const [agricultores, setAgricultores] = useState<any[]>([]);
    const [fases, setFases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [iniciando, setIniciando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Selecciones
    const [semillaId, setSemillaId] = useState<number | null>(null);
    const [seleccionados, setSeleccionados] = useState<number[]>([]);

    // UI toggles
    const [mostrarSemillas, setMostrarSemillas] = useState(false);

    useEffect(() => { cargar(); }, []);

    const cargar = async () => {
        setLoading(true);
        setError(null);
        try {
            const [dataLote, dataSemillas, dataAgricultores] = await Promise.all([
                obtenerLote(loteId),
                getSemillas(),
                getAgricultores(),
            ]);
            setLote(dataLote);
            setSemillas(dataSemillas);
            setAgricultores(dataAgricultores);

            if (dataLote.semilla_id) setSemillaId(dataLote.semilla_id);

            if (parcelaId) {
                const dp = await getParcelaById(parseInt(parcelaId as string));
                setParcela(dp);
            }

            if (dataLote.estado !== 'Creado') {
                const df = await getFasesLote(loteId);
                setFases(df);
            }
        } catch {
            setError('Error al cargar los datos del lote.');
        } finally {
            setLoading(false);
        }
    };

    const toggleTrabajador = (pid: number) => {
        setSeleccionados(prev =>
            prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]
        );
    };

    const handleIniciarEtapa = async () => {
        if (!semillaId) { setError('Selecciona una semilla.'); return; }
        if (seleccionados.length === 0) { setError('Selecciona al menos un trabajador.'); return; }
        setError(null);
        setIniciando(true);
        try {
            await iniciarEtapa(loteId, semillaId, seleccionados);
            setSuccess('¡Etapa iniciada correctamente!');
            await cargar();
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? 'Error al iniciar la etapa.');
        } finally {
            setIniciando(false);
        }
    };

    // ── Loading / Error ────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[s.center, { backgroundColor: c.surface }]}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    if (!lote) {
        return (
            <View style={[s.center, { backgroundColor: c.surface }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={c.error} />
                <Text style={{ color: c.error, marginTop: 12 }}>Lote no encontrado</Text>
            </View>
        );
    }

    const estaCreado = lote.estado === 'Creado';
    const semillaActual = semillas.find(s => s.id === semillaId);

    return (
        <View style={[s.container, { backgroundColor: c.background }]}>
            {/* ── Header ── */}
            <View style={[s.header, { borderBottomColor: c.outlineVariant, backgroundColor: c.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={c.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[s.headerTitle, { color: c.onSurface }]}>Lote {lote.codigo}</Text>
                    <Text style={[s.headerSub, { color: c.onSurfaceVariant }]}>Detalle del lote</Text>
                </View>
                <EstadoBadge estado={lote.estado} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>
                {/* ── Info General ── */}
                <Card variant="elevated" style={s.card}>
                    <Text style={[s.sectionTitle, { color: c.onSurface }]}>Información General</Text>
                    <InfoRow label="Código" value={lote.codigo} />
                    <InfoRow label="Hectáreas" value={`${lote.hectareas_asignadas} ha`} />
                    <InfoRow label="Estado" value={lote.estado} />
                    {lote.tipo_zona && <InfoRow label="Tipo de zona" value={lote.tipo_zona} />}
                    {parcela && (
                        <>
                            <View style={[s.divider, { backgroundColor: c.outlineVariant }]} />
                            <InfoRow label="Parcela" value={parcela.codigo} />
                            <InfoRow label="Textura" value={parcela.textura ?? '—'} />
                            <InfoRow label="Tipo terreno" value={parcela.tipo_terreno ?? '—'} />
                        </>
                    )}
                    {semillaActual && (
                        <>
                            <View style={[s.divider, { backgroundColor: c.outlineVariant }]} />
                            <InfoRow label="Semilla" value={semillaActual.variedad} />
                            <InfoRow label="Origen" value={semillaActual.origen ?? '—'} />
                        </>
                    )}
                    <InfoRow label="Creado" value={fmtFecha(lote.fecha_creacion)} />
                </Card>

                {/* ── CREADO: Iniciar producción ── */}
                {estaCreado && (
                    <Card variant="elevated" style={s.card}>
                        <Text style={[s.sectionTitle, { color: c.onSurface }]}>Iniciar Producción</Text>

                        <View style={[s.infoBanner, { backgroundColor: c.primaryContainer, borderColor: c.primary }]}>
                            <MaterialCommunityIcons name="information-outline" size={16} color={c.primary} />
                            <Text style={[s.infoBannerText, { color: c.onPrimaryContainer }]}>
                                El lote aún no está en producción. Selecciona una semilla y asigna trabajadores para iniciar la etapa.
                            </Text>
                        </View>

                        {/* Semilla */}
                        <Text style={[s.subTitle, { color: c.onSurface }]}>Semilla *</Text>

                        {semillaActual ? (
                            <View style={[s.semillaSeleccionada, { backgroundColor: c.success + '15', borderColor: c.success }]}>
                                <MaterialCommunityIcons name="check-circle" size={18} color={c.success} />
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={[s.semillaVar, { color: c.onSurface }]}>{semillaActual.variedad}</Text>
                                    <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{semillaActual.origen}</Text>
                                </View>
                                <TouchableOpacity onPress={() => { setSemillaId(null); setMostrarSemillas(true); }}>
                                    <Text style={{ color: c.primary, fontSize: 12 }}>Cambiar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={s.semillaBtns}>
                                <TouchableOpacity
                                    style={[s.semillaBtn, { borderColor: c.primary, backgroundColor: mostrarSemillas ? c.primaryContainer : 'transparent' }]}
                                    onPress={() => setMostrarSemillas(!mostrarSemillas)}>
                                    <MaterialCommunityIcons name="leaf" size={16} color={c.primary} />
                                    <Text style={[s.semillaBtnText, { color: c.primary }]}>
                                        {mostrarSemillas ? 'Ocultar semillas' : 'Seleccionar semilla'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.semillaBtn, { borderColor: c.secondary }]}
                                    onPress={() => router.push({ pathname: '/agregarSemilla' as any, params: { returnToLoteId: loteId } })}>
                                    <MaterialCommunityIcons name="plus" size={16} color={c.secondary} />
                                    <Text style={[s.semillaBtnText, { color: c.secondary }]}>Nueva semilla</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {mostrarSemillas && !semillaActual && (
                            <View style={[s.listBox, { borderColor: c.outlineVariant }]}>
                                {semillas.length === 0 ? (
                                    <Text style={{ color: c.onSurfaceVariant, textAlign: 'center', padding: 16 }}>
                                        No hay semillas registradas
                                    </Text>
                                ) : (
                                    semillas.map(sem => (
                                        <TouchableOpacity
                                            key={sem.id}
                                            style={[
                                                s.listItem,
                                                { borderBottomColor: c.outlineVariant },
                                                semillaId === sem.id && { backgroundColor: c.primaryContainer },
                                            ]}
                                            onPress={() => { setSemillaId(sem.id); setMostrarSemillas(false); }}>
                                            <MaterialCommunityIcons name="leaf" size={16} color={semillaId === sem.id ? c.primary : c.onSurfaceVariant} />
                                            <View style={{ flex: 1, marginLeft: 8 }}>
                                                <Text style={[s.listItemTitle, { color: c.onSurface }]}>{sem.variedad}</Text>
                                                <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{sem.origen}</Text>
                                            </View>
                                            {semillaId === sem.id && <MaterialCommunityIcons name="check" size={18} color={c.primary} />}
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        )}

                        {/* Trabajadores Agricultores */}
                        <View style={s.workerHeader}>
                            <Text style={[s.subTitle, { color: c.onSurface }]}>Trabajadores Agricultores *</Text>
                            <TouchableOpacity
                                style={[s.addWorkerBtn, { borderColor: c.secondary }]}
                                onPress={() => router.push({ pathname: '/personal/agregar' as any, params: { returnToLoteId: loteId } })}>
                                <MaterialCommunityIcons name="plus" size={14} color={c.secondary} />
                                <Text style={[s.addWorkerText, { color: c.secondary }]}>Agregar</Text>
                            </TouchableOpacity>
                        </View>

                        {agricultores.length === 0 ? (
                            <View style={[s.emptyBox, { borderColor: c.outlineVariant }]}>
                                <MaterialCommunityIcons name="account-off-outline" size={32} color={c.onSurfaceVariant} />
                                <Text style={{ color: c.onSurfaceVariant, marginTop: 8 }}>No hay agricultores registrados</Text>
                            </View>
                        ) : (
                            <View style={[s.listBox, { borderColor: c.outlineVariant }]}>
                                {agricultores.map(ag => {
                                    const ocupado = !!ag.lote_activo_id;
                                    const seleccionado = seleccionados.includes(ag.id);
                                    return (
                                        <TouchableOpacity
                                            key={ag.id}
                                            disabled={ocupado}
                                            onPress={() => toggleTrabajador(ag.id)}
                                            style={[
                                                s.listItem,
                                                { borderBottomColor: c.outlineVariant },
                                                seleccionado && { backgroundColor: c.primaryContainer },
                                                ocupado && { opacity: 0.55 },
                                            ]}>
                                            <View style={[s.checkbox, {
                                                borderColor: ocupado ? c.onSurfaceVariant : c.primary,
                                                backgroundColor: seleccionado ? c.primary : 'transparent',
                                            }]}>
                                                {seleccionado && <MaterialCommunityIcons name="check" size={12} color={c.onPrimary ?? '#fff'} />}
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 10 }}>
                                                <Text style={[s.listItemTitle, { color: c.onSurface }]}>
                                                    {ag.nombres} {ag.apellidos}
                                                </Text>
                                                {ocupado ? (
                                                    <View style={s.ocupadoRow}>
                                                        <MaterialCommunityIcons name="lock-outline" size={12} color={c.error} />
                                                        <Text style={{ fontSize: 11, color: c.error, marginLeft: 4 }}>
                                                            En lote {ag.lote_activo_codigo} — {ag.fase_activa}
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>Disponible</Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {seleccionados.length > 0 && (
                            <Text style={[s.selCount, { color: c.primary }]}>
                                {seleccionados.length} trabajador{seleccionados.length > 1 ? 'es' : ''} seleccionado{seleccionados.length > 1 ? 's' : ''}
                            </Text>
                        )}

                        {/* Banners de validación / confirmación */}
                        {error && (
                            <View style={[s.banner, { backgroundColor: c.error + '15', borderColor: c.error }]}>
                                <MaterialCommunityIcons name="alert-circle" size={15} color={c.error} />
                                <Text style={[s.bannerText, { color: c.error }]}>{error}</Text>
                            </View>
                        )}
                        {success && (
                            <View style={[s.banner, { backgroundColor: c.success + '15', borderColor: c.success }]}>
                                <MaterialCommunityIcons name="check-circle" size={15} color={c.success} />
                                <Text style={[s.bannerText, { color: c.success }]}>{success}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[s.btnIniciar, { backgroundColor: iniciando ? c.onSurfaceVariant : c.primary }]}
                            onPress={handleIniciarEtapa}
                            disabled={iniciando}>
                            {iniciando
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <MaterialCommunityIcons name="play-circle-outline" size={20} color="#fff" />}
                            <Text style={s.btnIniciarText}>
                                {iniciando ? 'Iniciando...' : 'Iniciar Etapa'}
                            </Text>
                        </TouchableOpacity>
                    </Card>
                )}

                {/* ── EN_PRODUCCION: Progreso + Fases ── */}
                {!estaCreado && (
                    <>
                        {fases.length > 0 && (
                            <Card variant="elevated" style={s.card}>
                                <ProgresoLote fases={fases} colors={c} />
                            </Card>
                        )}
                        <Card variant="elevated" style={s.card}>
                            <Text style={[s.sectionTitle, { color: c.onSurface }]}>Fases del Lote</Text>
                            {fases.length === 0 ? (
                                <Text style={{ color: c.onSurfaceVariant }}>Sin fases registradas.</Text>
                            ) : (
                                fases.map((fase, idx) => (
                                    <FaseCard key={fase.id} fase={fase} colors={c} isLast={idx === fases.length - 1} />
                                ))
                            )}
                        </Card>
                    </>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

// ── ProgresoLote ───────────────────────────────────────────────────────────
function ProgresoLote({ fases, colors: c }: { fases: any[]; colors: any }) {
    const completadas = fases.filter(f => f.estado === 'Completada').length;
    const enProceso = fases.find(f => f.estado === 'En Proceso');
    const pct = Math.round((completadas / FASES_ORDEN.length) * 100);

    return (
        <View style={sp.wrapper}>
            <View style={sp.headerRow}>
                <Text style={[sp.titulo, { color: c.onSurface }]}>Progreso de producción</Text>
                <Text style={[sp.pct, { color: c.primary }]}>{pct}%</Text>
            </View>

            {/* Barra continua */}
            <View style={[sp.barBg, { backgroundColor: c.outlineVariant }]}>
                <View style={[sp.barFill, { width: `${pct}%` as any, backgroundColor: c.primary }]} />
            </View>

            {/* Etapas */}
            <View style={sp.etapas}>
                {FASES_ORDEN.map((nombre) => {
                    const fase = fases.find(f => f.fase_nombre === nombre);
                    const completada = fase?.estado === 'Completada';
                    const activa = fase?.estado === 'En Proceso';
                    const color = completada ? c.success : activa ? c.primary : c.outlineVariant;
                    return (
                        <View key={nombre} style={sp.etapaCol}>
                            <View style={[sp.dot, { backgroundColor: color, borderColor: color }]}>
                                {completada && <MaterialCommunityIcons name="check" size={9} color="#fff" />}
                                {activa && <View style={[sp.dotInner, { backgroundColor: '#fff' }]} />}
                            </View>
                            <Text
                                style={[sp.etapaLabel, { color: completada || activa ? c.onSurface : c.onSurfaceVariant }]}
                                numberOfLines={2}>
                                {nombre}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {enProceso && (
                <View style={[sp.etapaActualBadge, { backgroundColor: c.primary + '15', borderColor: c.primary }]}>
                    <MaterialCommunityIcons name="progress-clock" size={13} color={c.primary} />
                    <Text style={[sp.etapaActualText, { color: c.primary }]}>
                        Etapa actual: {enProceso.fase_nombre}
                    </Text>
                </View>
            )}
        </View>
    );
}

const sp = StyleSheet.create({
    wrapper: { marginBottom: 0 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    titulo: { fontSize: 14, fontWeight: '700' },
    pct: { fontSize: 14, fontWeight: '700' },
    barBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
    barFill: { height: 8, borderRadius: 4 },
    etapas: { flexDirection: 'row', justifyContent: 'space-between' },
    etapaCol: { alignItems: 'center', flex: 1 },
    dot: {
        width: 18, height: 18, borderRadius: 9, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    dotInner: { width: 6, height: 6, borderRadius: 3 },
    etapaLabel: { fontSize: 8, textAlign: 'center', fontWeight: '500' },
    etapaActualBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
        marginTop: 10, alignSelf: 'flex-start',
    },
    etapaActualText: { fontSize: 12, fontWeight: '600' },
});

// ── FaseCard ───────────────────────────────────────────────────────────────
function FaseCard({ fase, colors: c, isLast }: { fase: any; colors: any; isLast: boolean }) {
    const estadoColor =
        fase.estado === 'Completada' ? c.success :
        fase.estado === 'En Proceso' ? c.secondary :
        c.onSurfaceVariant;

    return (
        <View style={[s.faseCard, { borderColor: c.outlineVariant }, !isLast && { marginBottom: 12 }]}>
            <View style={s.faseHeader}>
                <View style={[s.faseOrden, { backgroundColor: c.primaryContainer }]}>
                    <Text style={[s.faseOrdenText, { color: c.primary }]}>{fase.fase_orden}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[s.faseNombre, { color: c.onSurface }]}>{fase.fase_nombre}</Text>
                    <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>
                        Inicio: {fmtFecha(fase.fecha_inicio)}
                        {fase.fecha_fin ? `  ·  Fin: ${fmtFecha(fase.fecha_fin)}` : ''}
                    </Text>
                </View>
                <View style={[s.badge, { backgroundColor: estadoColor + '22', borderColor: estadoColor }]}>
                    <Text style={[s.badgeText, { color: estadoColor }]}>{fase.estado}</Text>
                </View>
            </View>

            {fase.trabajadores?.length > 0 && (
                <View style={[s.trabajadoresBox, { borderTopColor: c.outlineVariant }]}>
                    <Text style={[s.trabajadoresLabel, { color: c.onSurfaceVariant }]}>Trabajadores:</Text>
                    {fase.trabajadores.map((t: any) => (
                        <View key={t.id} style={s.trabajadorRow}>
                            <MaterialCommunityIcons name="account" size={14} color={c.primary} />
                            <Text style={[s.trabajadorNombre, { color: c.onSurface }]}>
                                {t.nombres} {t.apellidos}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        borderBottomWidth: 1, gap: Spacing.sm,
    },
    backBtn: { padding: Spacing.xs },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSub: { fontSize: 12 },
    scroll: { padding: Spacing.md },
    card: { marginBottom: Spacing.md },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
    subTitle: { fontSize: 14, fontWeight: '600', marginTop: Spacing.md, marginBottom: Spacing.sm },
    divider: { height: 1, marginVertical: Spacing.sm },

    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    infoLabel: { fontSize: 13 },
    infoValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

    badge: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: BorderRadius.full, borderWidth: 1,
    },
    badgeText: { fontSize: 11, fontWeight: '700' },

    banner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
        borderWidth: 1, borderRadius: BorderRadius.md,
        padding: Spacing.sm, marginBottom: Spacing.sm,
    },
    bannerText: { flex: 1, fontSize: 13 },

    infoBanner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        borderWidth: 1, borderRadius: BorderRadius.md,
        padding: Spacing.sm, marginBottom: Spacing.md,
    },
    infoBannerText: { flex: 1, fontSize: 13 },

    semillaBtns: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
    semillaBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm, paddingVertical: 7,
    },
    semillaBtnText: { fontSize: 13, fontWeight: '600' },
    semillaSeleccionada: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.sm,
    },
    semillaVar: { fontSize: 14, fontWeight: '600' },

    listBox: { borderWidth: 1, borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.xs },
    listItem: {
        flexDirection: 'row', alignItems: 'center',
        padding: Spacing.sm, borderBottomWidth: 1,
    },
    listItemTitle: { fontSize: 14, fontWeight: '600' },

    checkbox: {
        width: 20, height: 20, borderRadius: 4, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center',
    },
    ocupadoRow: { flexDirection: 'row', alignItems: 'center' },

    workerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md },
    addWorkerBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm, paddingVertical: 5,
    },
    addWorkerText: { fontSize: 12, fontWeight: '600' },
    emptyBox: {
        borderWidth: 1, borderRadius: BorderRadius.md, borderStyle: 'dashed',
        alignItems: 'center', padding: Spacing.lg, marginTop: Spacing.xs,
    },
    selCount: { fontSize: 13, fontWeight: '600', marginTop: Spacing.sm, textAlign: 'center' },

    btnIniciar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderRadius: BorderRadius.md,
        paddingVertical: 14, marginTop: Spacing.lg,
    },
    btnIniciarText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    faseCard: { borderWidth: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
    faseHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm },
    faseOrden: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    faseOrdenText: { fontSize: 12, fontWeight: '700' },
    faseNombre: { fontSize: 14, fontWeight: '700' },
    trabajadoresBox: { borderTopWidth: 1, paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm, paddingTop: 6 },
    trabajadoresLabel: { fontSize: 11, marginBottom: 4 },
    trabajadorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
    trabajadorNombre: { fontSize: 13 },
});
