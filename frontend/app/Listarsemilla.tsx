import React from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card, SearchBar, Button } from '@/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSemillas } from '@/services/semilla_service';

interface Semilla {
    id: number;
    variedad: string;
    origen?: string;
    metodo_secado?: string;
    seleccion?: string;
    olor?: string;
    color?: string;
    integridad_pergamino?: string;
}

export default function Listarsemilla() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [semillas, setSemillas] = React.useState<Semilla[]>([]);
    const [searchText, setSearchText] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        fetchSemillas();
    }, []);

    const fetchSemillas = async () => {
        try {
            setLoading(true);
            const data = await getSemillas();
            setSemillas(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar las semillas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredSemillas = semillas.filter((semilla) =>
        semilla.variedad?.toLowerCase().includes(searchText.toLowerCase()) ||
        semilla.origen?.toLowerCase().includes(searchText.toLowerCase())
    );

    const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string }) => (
        <View style={styles.infoRow}>
            <MaterialCommunityIcons name={icon as any} size={16} color={colors.secondary} />
            <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                {label}:
            </Text>
            <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                {value || 'No especificado'}
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.onSurface }]}>
                            Semillas
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                            {filteredSemillas.length} {filteredSemillas.length === 1 ? 'semilla' : 'semillas'}
                        </Text>
                    </View>
                    <Button
                        title="Agregar"
                        onPress={() => router.push('/agregarSemilla')}
                        variant="secondary"
                        size="small"
                    />
                </View>
            </View>

            {/* Search Bar */}
            <SearchBar
                placeholder="Buscar por variedad u origen..."
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchBar}
            />

            {/* Loading State */}
            {loading && (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                        Cargando semillas...
                    </Text>
                </View>
            )}

            {/* Error State */}
            {error && !loading && (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        {error}
                    </Text>
                    <Button
                        title="Reintentar"
                        onPress={fetchSemillas}
                        variant="primary"
                        style={styles.retryButton}
                    />
                </View>
            )}

            {/* Empty State */}
            {!loading && !error && filteredSemillas.length === 0 && (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="magnify-close" size={48} color={colors.onSurfaceVariant} />
                    <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                        {searchText ? 'No se encontraron semillas' : 'No hay semillas disponibles'}
                    </Text>
                </View>
            )}

            {/* Semillas List */}
            {!loading && !error && filteredSemillas.length > 0 && (
                <ScrollView
                    style={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                >
                    {filteredSemillas.map((semilla) => (
                        <Card key={semilla.id} variant="elevated" style={styles.card}>
                            {/* Card Header */}
                            <View style={styles.cardHeader}>
                                <View style={[styles.varietyBadge, { backgroundColor: colors.secondaryContainer }]}>
                                    <MaterialCommunityIcons name="leaf" size={20} color={colors.onSecondaryContainer} />
                                </View>
                                <View style={styles.headerContent}>
                                    <Text style={[styles.varietyTitle, { color: colors.onSurface }]}>
                                        {semilla.variedad}
                                    </Text>
                                    {semilla.origen && (
                                        <Text style={[styles.originText, { color: colors.onSurfaceVariant }]}>
                                            📍 {semilla.origen}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Card Content - Info Grid */}
                            <View style={styles.infoGrid}>
                                {semilla.metodo_secado && (
                                    <InfoRow
                                        icon="fan"
                                        label="Secado"
                                        value={semilla.metodo_secado}
                                    />
                                )}
                                {semilla.seleccion && (
                                    <InfoRow
                                        icon="filter"
                                        label="Selección"
                                        value={semilla.seleccion}
                                    />
                                )}
                                {semilla.olor && (
                                    <InfoRow
                                        icon="nose"
                                        label="Olor"
                                        value={semilla.olor}
                                    />
                                )}
                                {semilla.color && (
                                    <InfoRow
                                        icon="palette"
                                        label="Color"
                                        value={semilla.color}
                                    />
                                )}
                                {semilla.integridad_pergamino && (
                                    <InfoRow
                                        icon="check-circle"
                                        label="Integridad"
                                        value={semilla.integridad_pergamino}
                                    />
                                )}
                            </View>

                            {/* Card Footer */}
                            <View style={[styles.cardFooter, { borderTopColor: colors.outlineVariant }]}>
                                <Button
                                    title="Ver detalles"
                                    onPress={() => console.log('Ver semilla:', semilla.id)}
                                    variant="primary"
                                    size="small"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="Editar"
                                    onPress={() => console.log('Editar semilla:', semilla.id)}
                                    variant="outlined"
                                    size="small"
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </Card>
                    ))}
                </ScrollView>
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
        borderBottomColor: Colors.light.outlineVariant,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
    },
    searchBar: {
        marginVertical: Spacing.lg,
    },
    listContainer: {
        flex: 1,
    },
    listContent: {
        paddingBottom: Spacing.lg,
    },
    card: {
        marginBottom: Spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
        gap: Spacing.md,
    },
    varietyBadge: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
    },
    varietyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    originText: {
        fontSize: 14,
        fontWeight: '400',
    },
    infoGrid: {
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '500',
        minWidth: 70,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        gap: Spacing.md,
        borderTopWidth: 1,
        paddingTop: Spacing.lg,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: Spacing.md,
    },
});

