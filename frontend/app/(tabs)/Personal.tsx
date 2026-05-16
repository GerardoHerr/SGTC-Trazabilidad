import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
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
import { getPersonal } from '@/services/personal_service';

interface Trabajador {
    id: number;
    nombres: string;
    apellidos: string;
    identificacion: string;
    telefono: string;
    rol: string;
}

const PAGE_SIZE = 10;

const ROL_COLOR: Record<string, string> = {
    Recolector: '#3a6843',
    Fumigador: '#b3261e',
    Operario: '#412d11',
    Supervisor: '#6d4c44',
    Capataz: '#442a22',
};

function getInitials(nombres: string, apellidos: string): string {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

export default function PersonalScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const fetchPersonal = useCallback(async (search: string, page: number) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getPersonal(page * PAGE_SIZE, PAGE_SIZE, search);
            setTrabajadores(data.trabajadores);
            setTotal(data.total);
        } catch {
            setError('No se pudo cargar el personal. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Recarga al enfocar la pantalla (volver de agregar/editar)
    useFocusEffect(
        useCallback(() => {
            fetchPersonal(searchText, currentPage);
        }, [])
    );

    const handleSearch = (text: string) => {
        setSearchText(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setCurrentPage(0);
            fetchPersonal(text, 0);
        }, 300);
    };

    const handleClearSearch = () => {
        setSearchText('');
        setCurrentPage(0);
        fetchPersonal('', 0);
    };

    const handlePrevPage = () => {
        const newPage = Math.max(0, currentPage - 1);
        setCurrentPage(newPage);
        fetchPersonal(searchText, newPage);
    };

    const handleNextPage = () => {
        const newPage = Math.min(totalPages - 1, currentPage + 1);
        setCurrentPage(newPage);
        fetchPersonal(searchText, newPage);
    };

    const renderTrabajador = ({ item }: { item: Trabajador }) => {
        const rolColor = ROL_COLOR[item.rol] ?? colors.primary;
        return (
            <Card variant="elevated" style={styles.card}>
                {/* Encabezado de tarjeta */}
                <View style={styles.cardHeader}>
                    <View
                        style={[
                            styles.inicialesBadge,
                            { backgroundColor: colors.primaryContainer },
                        ]}>
                        <Text style={[styles.iniciales, { color: colors.onPrimaryContainer }]}>
                            {getInitials(item.nombres, item.apellidos)}
                        </Text>
                    </View>
                    <View style={styles.cardNombre}>
                        <Text
                            style={[styles.nombreCompleto, { color: colors.onSurface }]}
                            numberOfLines={1}>
                            {item.nombres} {item.apellidos}
                        </Text>
                        <Text style={[styles.cedula, { color: colors.onSurfaceVariant }]}>
                            C.C. {item.identificacion}
                        </Text>
                    </View>
                </View>

                {/* Detalles */}
                <View style={styles.cardDetalles}>
                    <View
                        style={[
                            styles.rolBadge,
                            {
                                backgroundColor: rolColor + '18',
                                borderColor: rolColor + '50',
                            },
                        ]}>
                        <MaterialCommunityIcons name="briefcase-outline" size={12} color={rolColor} />
                        <Text style={[styles.rolText, { color: rolColor }]}>{item.rol}</Text>
                    </View>
                    <View style={styles.telefonoRow}>
                        <MaterialCommunityIcons
                            name="phone-outline"
                            size={13}
                            color={colors.onSurfaceVariant}
                        />
                        <Text style={[styles.telefonoText, { color: colors.onSurfaceVariant }]}>
                            {item.telefono}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.outlineVariant }]}>
                    <Button
                        title="Editar"
                        onPress={() => router.push(`/personal/${item.id}`)}
                        variant="outlined"
                        size="small"
                        style={{ flex: 1 }}
                    />
                </View>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
                <View style={styles.headerTop}>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.onSurface }]}>Personal</Text>
                        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                            {total} {total === 1 ? 'trabajador' : 'trabajadores'}
                        </Text>
                    </View>
                    <Button
                        title="Agregar"
                        onPress={() => router.push('/personal/agregar')}
                        variant="secondary"
                        size="small"
                    />
                </View>
            </View>

            {/* Búsqueda */}
            <View style={styles.searchContainer}>
                <SearchBar
                    placeholder="Buscar por nombre, apellido o cédula..."
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

            {/* Cargando */}
            {loading && (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
                        Cargando personal...
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
                        onPress={() => fetchPersonal(searchText, currentPage)}
                        variant="primary"
                    />
                </View>
            )}

            {/* Sin resultados */}
            {!loading && !error && trabajadores.length === 0 && (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons
                        name="account-search-outline"
                        size={56}
                        color={colors.onSurfaceVariant}
                    />
                    <Text style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
                        {searchText
                            ? 'No se encontraron trabajadores con ese criterio'
                            : 'No hay trabajadores registrados'}
                    </Text>
                    {searchText ? (
                        <Button
                            title="Limpiar búsqueda"
                            onPress={handleClearSearch}
                            variant="outlined"
                        />
                    ) : null}
                </View>
            )}

            {/* Lista */}
            {!loading && !error && trabajadores.length > 0 && (
                <FlatList
                    data={trabajadores}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderTrabajador}
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
                        <MaterialCommunityIcons
                            name="chevron-left"
                            size={24}
                            color={colors.primary}
                        />
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
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={24}
                            color={colors.primary}
                        />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
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
    title: {
        ...Typography.displaySmall,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.bodyMedium,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginVertical: Spacing.lg,
    },
    clearBtn: {
        padding: Spacing.xs,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
    card: {
        marginBottom: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    inicialesBadge: {
        width: 46,
        height: 46,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iniciales: {
        ...Typography.headlineSmall,
        fontWeight: '700',
    },
    cardNombre: { flex: 1 },
    nombreCompleto: {
        ...Typography.headlineSmall,
        marginBottom: 2,
    },
    cedula: {
        ...Typography.labelMedium,
    },
    cardDetalles: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
        flexWrap: 'wrap',
    },
    rolBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    rolText: {
        ...Typography.labelMedium,
        fontWeight: '600',
    },
    telefonoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    telefonoText: {
        ...Typography.labelMedium,
    },
    cardFooter: {
        borderTopWidth: 1,
        paddingTop: Spacing.md,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    stateText: {
        ...Typography.bodyLarge,
        textAlign: 'center',
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
    },
    pageBtn: {
        padding: Spacing.sm,
    },
    pageText: {
        ...Typography.labelLarge,
    },
});
