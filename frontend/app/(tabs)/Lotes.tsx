import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator, FlatList, StyleSheet,
    Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card, Button, SearchBar } from '@/components';
import { listarLotes } from '@/services/lote_service';

const ESTADO_CONFIG: Record<string, { color: string; icon: string }> = {
    'Creado':        { color: '#f59e0b', icon: 'clock-outline' },
    'En Proceso':    { color: '#3b82f6', icon: 'progress-clock' },
    'En Producción': { color: '#22c55e', icon: 'sprout' },
    'Completado':    { color: '#8b5cf6', icon: 'check-circle-outline' },
    'Archivado':     { color: '#6b7280', icon: 'archive-outline' },
};

const FILTROS = ['Todos', 'Creado', 'En Proceso', 'En Producción', 'Completado', 'Archivado'];

function EstadoBadge({ estado, colors }: { estado: string; colors: any }) {
    const cfg = ESTADO_CONFIG[estado] ?? { color: colors.onSurfaceVariant, icon: 'help-circle-outline' };
    return (
        <View style={[s.badge, { backgroundColor: cfg.color + '20', borderColor: cfg.color }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[s.badgeText, { color: cfg.color }]}>{estado}</Text>
        </View>
    );
}

export default function LotesScreen() {
    const cs = useColorScheme();
    const c = Colors[cs ?? 'light'];
    const router = useRouter();

    const [lotes, setLotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const [search, setSearch] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Pedimos todos los estados pasando un estado vacío (el backend devolverá activos)
            // Para ver todos usamos la lista completa llamando múltiples veces o pasando todos los estados
            const [activos, completados, archivados] = await Promise.all([
                (listarLotes as any)(),
                (listarLotes as any)(null, 'Completado'),
                (listarLotes as any)(null, 'Archivado'),
            ]);
            setLotes([...activos, ...completados, ...archivados]);
        } catch {
            setError('No se pudieron cargar los lotes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

    // Filtros cliente
    const lotesFiltrados = lotes.filter(l => {
        const matchEstado = filtroEstado === 'Todos' || l.estado === filtroEstado;
        const matchSearch = search === '' ||
            l.codigo?.toLowerCase().includes(search.toLowerCase());
        return matchEstado && matchSearch;
    });

    const renderLote = ({ item }: { item: any }) => (
        <Card variant="elevated" style={s.card}>
            <View style={s.cardHeader}>
                <View style={s.codeBox}>
                    <MaterialCommunityIcons name="land-fields" size={18} color={c.primary} />
                    <Text style={[s.code, { color: c.onSurface }]}>{item.codigo}</Text>
                </View>
                <EstadoBadge estado={item.estado} colors={c} />
            </View>

            <View style={s.infoRow}>
                <View style={s.infoCell}>
                    <Text style={[s.infoLabel, { color: c.onSurfaceVariant }]}>Hectáreas</Text>
                    <Text style={[s.infoVal, { color: c.onSurface }]}>{item.hectareas_asignadas} ha</Text>
                </View>
                {item.tipo_zona && (
                    <View style={s.infoCell}>
                        <Text style={[s.infoLabel, { color: c.onSurfaceVariant }]}>Zona</Text>
                        <Text style={[s.infoVal, { color: c.onSurface }]}>{item.tipo_zona}</Text>
                    </View>
                )}
                <View style={s.infoCell}>
                    <Text style={[s.infoLabel, { color: c.onSurfaceVariant }]}>Semilla</Text>
                    <Text style={[s.infoVal, { color: item.semilla_id ? c.success : c.onSurfaceVariant }]}>
                        {item.semilla_id ? 'Asignada' : 'Sin asignar'}
                    </Text>
                </View>
            </View>

            <View style={[s.footer, { borderTopColor: c.outlineVariant }]}>
                <TouchableOpacity
                    style={[s.verBtn, { borderColor: c.primary }]}
                    onPress={() => router.push({
                        pathname: '/lote/[id]' as any,
                        params: { id: item.id },
                    })}>
                    <MaterialCommunityIcons name="eye-outline" size={14} color={c.primary} />
                    <Text style={[s.verBtnText, { color: c.primary }]}>Ver detalle</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={[s.container, { backgroundColor: c.surface }]}>
            {/* Header */}
            <View style={[s.header, { borderBottomColor: c.outlineVariant }]}>
                <View>
                    <Text style={[s.title, { color: c.onSurface }]}>Lotes</Text>
                    <Text style={[s.sub, { color: c.onSurfaceVariant }]}>
                        {lotesFiltrados.length} lote{lotesFiltrados.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            {/* Búsqueda */}
            <View style={s.searchRow}>
                <SearchBar
                    placeholder="Buscar por código..."
                    value={search}
                    onChangeText={setSearch}
                    style={{ flex: 1 }}
                />
                {search !== '' && (
                    <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
                        <MaterialCommunityIcons name="close-circle" size={20} color={c.onSurfaceVariant} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filtros por estado */}
            <View style={s.filtrosRow}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={FILTROS}
                    keyExtractor={f => f}
                    contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.md }}
                    renderItem={({ item: f }) => (
                        <TouchableOpacity
                            onPress={() => setFiltroEstado(f)}
                            style={[
                                s.filtroChip,
                                {
                                    backgroundColor: filtroEstado === f ? c.primary : c.surfaceContainerLow,
                                    borderColor: filtroEstado === f ? c.primary : c.outlineVariant,
                                },
                            ]}>
                            <Text style={[s.filtroText, { color: filtroEstado === f ? '#fff' : c.onSurface }]}>
                                {f}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Estados */}
            {loading && (
                <View style={s.center}>
                    <ActivityIndicator size="large" color={c.primary} />
                    <Text style={[s.stateText, { color: c.onSurfaceVariant }]}>Cargando lotes...</Text>
                </View>
            )}

            {error && !loading && (
                <View style={s.center}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={48} color={c.error} />
                    <Text style={[s.stateText, { color: c.error }]}>{error}</Text>
                    <Button title="Reintentar" onPress={cargar} variant="primary" />
                </View>
            )}

            {!loading && !error && lotesFiltrados.length === 0 && (
                <View style={s.center}>
                    <MaterialCommunityIcons name="land-fields" size={52} color={c.onSurfaceVariant} />
                    <Text style={[s.stateText, { color: c.onSurfaceVariant }]}>
                        {search || filtroEstado !== 'Todos'
                            ? 'No hay lotes con ese criterio'
                            : 'No hay lotes registrados'}
                    </Text>
                </View>
            )}

            {!loading && !error && lotesFiltrados.length > 0 && (
                <FlatList
                    data={lotesFiltrados}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderLote}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg,
        paddingBottom: Spacing.md, borderBottomWidth: 1,
    },
    title: { ...Typography.displaySmall, marginBottom: 2 },
    sub: { ...Typography.bodyMedium },
    searchRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    filtrosRow: { paddingBottom: Spacing.sm },
    filtroChip: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: BorderRadius.full, borderWidth: 1,
    },
    filtroText: { fontSize: 12, fontWeight: '600' },
    list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },
    card: {},
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    codeBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    code: { fontSize: 18, fontWeight: '700' },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: BorderRadius.full, borderWidth: 1,
    },
    badgeText: { fontSize: 10, fontWeight: '700' },
    infoRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
    infoCell: { flex: 1 },
    infoLabel: { fontSize: 11, marginBottom: 2 },
    infoVal: { fontSize: 13, fontWeight: '600' },
    footer: { borderTopWidth: 1, paddingTop: Spacing.sm },
    verBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderWidth: 1, borderRadius: BorderRadius.md, paddingVertical: 8,
    },
    verBtnText: { fontSize: 13, fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
    stateText: { ...Typography.bodyLarge, textAlign: 'center' },
});
