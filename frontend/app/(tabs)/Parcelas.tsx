import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button, Card, SearchBar } from '@/components';
import { getParcelas } from '@/services/parcela_service';

interface Parcela {
    id: number;
    codigo: string;
    hectareas: number;
    estado: string;
    tipo_terreno: string;
    tipo_zona: string[];
}

const PAGE_SIZE = 10;

const ESTADOS_FILTRO = ['Todos', 'Libre', 'En Proceso', 'En Producción'];

const ESTADO_CONFIG: Record<string, { color: string; icon: string }> = {
    Libre: { color: '#0f7938', icon: 'check-circle-outline' },
    'En Proceso': { color: '#b45309', icon: 'progress-clock' },
    'En Producción': { color: '#3a6843', icon: 'sprout' },
};

export default function ParcelasScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [parcelas, setParcelas] = useState<Parcela[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const fetchParcelas = useCallback(
        async (search: string, page: number, estado: string) => {
            try {
                setLoading(true);
                setError(null);
                const estadoParam = estado === 'Todos' ? '' : estado;
                const data = await getParcelas(page * PAGE_SIZE, PAGE_SIZE, search, estadoParam);
                setParcelas(data.parcelas);
                setTotal(data.total);
            } catch {
                setError('No se pudo cargar las parcelas. Verifica tu conexión.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useFocusEffect(
        useCallback(() => {
            fetchParcelas(searchText, currentPage, filtroEstado);
        }, [])
    );

    const handleSearch = (text: string) => {
        setSearchText(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setCurrentPage(0);
            fetchParcelas(text, 0, filtroEstado);
        }, 300);
    };

    const handleClearSearch = () => {
        setSearchText('');
        setCurrentPage(0);
        fetchParcelas('', 0, filtroEstado);
    };

    const handleFiltroEstado = (estado: string) => {
        setFiltroEstado(estado);
        setCurrentPage(0);
        fetchParcelas(searchText, 0, estado);
    };

    const handlePrevPage = () => {
        const newPage = Math.max(0, currentPage - 1);
        setCurrentPage(newPage);
        fetchParcelas(searchText, newPage, filtroEstado);
    };

    const handleNextPage = () => {
        const newPage = Math.min(totalPages - 1, currentPage + 1);
        setCurrentPage(newPage);
        fetchParcelas(searchText, newPage, filtroEstado);
    };

    const renderParcela = ({ item }: { item: Parcela }) => {
        const estadoCfg = ESTADO_CONFIG[item.estado] ?? { color: colors.primary, icon: 'map-outline' };
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/parcela/[id]' as any, params: { id: item.id } })}>
                <Card variant="elevated" style={styles.card}>
                    {/* Encabezado */}
                    <View style={styles.cardHeader}>
                        <View
                            style={[
                                styles.codigoBadge,
                                { backgroundColor: colors.primaryContainer },
                            ]}>
                            <MaterialCommunityIcons
                                name="map-marker"
                                size={18}
                                color={colors.onPrimaryContainer}
                            />
                        </View>
                        <View style={styles.cardTitulo}>
                            <Text style={[styles.codigo, { color: colors.onSurface }]}>
                                {item.codigo}
                            </Text>
                            <Text style={[styles.hectareas, { color: colors.onSurfaceVariant }]}>
                                {item.hectareas} ha
                            </Text>
                        </View>
                        {/* Badge de estado */}
                        <View
                            style={[
                                styles.estadoBadge,
                                {
                                    backgroundColor: estadoCfg.color + '18',
                                    borderColor: estadoCfg.color + '55',
                                },
                            ]}>
                            <MaterialCommunityIcons
                                name={estadoCfg.icon as any}
                                size={12}
                                color={estadoCfg.color}
                            />
                            <Text style={[styles.estadoText, { color: estadoCfg.color }]}>
                                {item.estado}
                            </Text>
                        </View>
                    </View>

                    {/* Detalles */}
                    <View style={styles.cardDetalles}>
                        <View style={styles.detalleChip}>
                            <MaterialCommunityIcons
                                name="terrain"
                                size={13}
                                color={colors.onSurfaceVariant}
                            />
                            <Text style={[styles.detalleText, { color: colors.onSurfaceVariant }]}>
                                {item.tipo_terreno}
                            </Text>
                        </View>
                        {(Array.isArray(item.tipo_zona) ? item.tipo_zona : [item.tipo_zona]).map(
                            (zona, i) => (
                                <View key={i} style={styles.detalleChip}>
                                    <MaterialCommunityIcons
                                        name="image-filter-hdr"
                                        size={13}
                                        color={colors.onSurfaceVariant}
                                    />
                                    <Text style={[styles.detalleText, { color: colors.onSurfaceVariant }]}>
                                        {zona}
                                    </Text>
                                </View>
                            )
                        )}
                    </View>

                    <View style={[styles.cardFooter, { borderTopColor: colors.outlineVariant }]}>
                        <Text style={[styles.verDetalle, { color: colors.secondary }]}>
                            Ver detalles →
                        </Text>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
                <View style={styles.headerTop}>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.onSurface }]}>Parcelas</Text>
                        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                            {total} {total === 1 ? 'parcela' : 'parcelas'}
                        </Text>
                    </View>
                    <Button
                        title="Nueva"
                        onPress={() => router.push('/parcela/agregar' as any)}
                        variant="secondary"
                        size="small"
                    />
                </View>
            </View>

            {/* Búsqueda */}
            <View style={styles.searchRow}>
                <SearchBar
                    placeholder="Buscar por código de parcela..."
                    value={searchText}
                    onChangeText={handleSearch}
                    style={{ flex: 1 }}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
                        <MaterialCommunityIcons
                            name="close-circle"
                            size={22}
                            color={colors.onSurfaceVariant}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Chips de filtro por estado */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtrosContainer}
                style={styles.filtrosScroll}>
                {ESTADOS_FILTRO.map((est) => {
                    const activo = filtroEstado === est;
                    const cfg = ESTADO_CONFIG[est];
                    return (
                        <TouchableOpacity
                            key={est}
                            onPress={() => handleFiltroEstado(est)}
                            style={[
                                styles.filtroChip,
                                {
                                    backgroundColor: activo
                                        ? cfg
                                            ? cfg.color
                                            : colors.primary
                                        : colors.surfaceContainerLow,
                                    borderColor: activo
                                        ? cfg
                                            ? cfg.color
                                            : colors.primary
                                        : colors.outlineVariant,
                                },
                            ]}>
                            {cfg && (
                                <MaterialCommunityIcons
                                    name={cfg.icon as any}
                                    size={13}
                                    color={activo ? '#fff' : cfg.color}
                                />
                            )}
                            <Text
                                style={[
                                    styles.filtroText,
                                    {
                                        color: activo ? '#fff' : colors.onSurface,
                                        fontWeight: activo ? '600' : '400',
                                    },
                                ]}>
                                {est}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Cargando */}
            {loading && (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
                        Cargando parcelas...
                    </Text>
                </View>
            )}

            {/* Error */}
            {error && !loading && (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={52} color={colors.error} />
                    <Text style={[styles.stateText, { color: colors.error }]}>{error}</Text>
                    <Button
                        title="Reintentar"
                        onPress={() => fetchParcelas(searchText, currentPage, filtroEstado)}
                        variant="primary"
                    />
                </View>
            )}

            {/* Sin resultados */}
            {!loading && !error && parcelas.length === 0 && (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons
                        name="map-search-outline"
                        size={56}
                        color={colors.onSurfaceVariant}
                    />
                    <Text style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
                        {searchText || filtroEstado !== 'Todos'
                            ? 'No se encontraron parcelas con ese criterio'
                            : 'No hay parcelas registradas'}
                    </Text>
                    {(searchText || filtroEstado !== 'Todos') && (
                        <Button
                            title="Limpiar filtros"
                            onPress={() => {
                                setSearchText('');
                                setFiltroEstado('Todos');
                                fetchParcelas('', 0, 'Todos');
                            }}
                            variant="outlined"
                        />
                    )}
                </View>
            )}

            {/* Lista */}
            {!loading && !error && parcelas.length > 0 && (
                <FlatList
                    data={parcelas}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderParcela}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Paginación */}
            {!loading && !error && totalPages > 1 && (
                <View style={[styles.pagination, { borderTopColor: colors.outlineVariant }]}>
                    <TouchableOpacity
                        onPress={handlePrevPage}
                        disabled={currentPage === 0}
                        style={[styles.pageBtn, { opacity: currentPage === 0 ? 0.35 : 1 }]}>
                        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.pageText, { color: colors.onSurface }]}>
                        Página {currentPage + 1} de {totalPages}
                    </Text>
                    <TouchableOpacity
                        onPress={handleNextPage}
                        disabled={currentPage >= totalPages - 1}
                        style={[
                            styles.pageBtn,
                            { opacity: currentPage >= totalPages - 1 ? 0.35 : 1 },
                        ]}>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: Spacing.lg },
    header: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    headerText: { flex: 1 },
    title: { ...Typography.displaySmall, marginBottom: Spacing.xs },
    subtitle: { ...Typography.bodyMedium },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
    clearBtn: { padding: Spacing.xs },
    filtrosScroll: { marginTop: Spacing.md },
    filtrosContainer: {
        gap: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    filtroChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    filtroText: { ...Typography.labelMedium },
    listContent: { paddingVertical: Spacing.md, paddingBottom: Spacing.xl },
    card: { marginBottom: Spacing.md },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    codigoBadge: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitulo: { flex: 1 },
    codigo: { ...Typography.headlineSmall, marginBottom: 2 },
    hectareas: { ...Typography.labelMedium },
    estadoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    estadoText: { ...Typography.labelSmall, fontWeight: '600' },
    cardDetalles: {
        flexDirection: 'row',
        gap: Spacing.md,
        flexWrap: 'wrap',
        marginBottom: Spacing.md,
    },
    detalleChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detalleText: { ...Typography.labelMedium },
    cardFooter: { borderTopWidth: 1, paddingTop: Spacing.sm },
    verDetalle: { ...Typography.labelMedium, fontWeight: '600' },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    stateText: { ...Typography.bodyLarge, textAlign: 'center' },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
    },
    pageBtn: { padding: Spacing.sm },
    pageText: { ...Typography.labelLarge },
});
