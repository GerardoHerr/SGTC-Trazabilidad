import React from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card, SearchBar, Button } from '@/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSemillas } from '@/services/semilla_service';
import Config from '@/constants/Config';

interface Semilla {
    id: number;
    variedad: string;
    origen?: string;
    metodo_secado?: string;
    seleccion?: string;
    olor?: string;
    color?: string;
    integridad_pergamino?: string;
    anexo_nombre?: string;
    anexo_tamano?: number;
    fecha_creacion?: string;
}

export default function Listarsemilla() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [semillas, setSemillas] = React.useState<Semilla[]>([]);
    const [searchText, setSearchText] = React.useState('');
    const [selectedVariedad, setSelectedVariedad] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [showVariedadFilter, setShowVariedadFilter] = React.useState(false);

    React.useEffect(() => {
        fetchSemillas();
    }, []);

    const fetchSemillas = async () => {
        try {
            setLoading(true);
            const data = await getSemillas();
            // Ordenar por fecha más reciente primero
            const sorted = data.sort((a: any, b: any) => {
                if (!a.fecha_creacion || !b.fecha_creacion) return 0;
                return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
            });
            setSemillas(sorted);
            setError(null);
        } catch (err) {
            setError('Error al cargar las semillas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Obtener lista única de variedades (CA-02)
    const varietades = Array.from(new Set(semillas.map(s => s.variedad).filter(Boolean)));

    // Filtrar semillas: por variedad y por texto de búsqueda
    const filteredSemillas = semillas.filter((semilla) => {
        // Aplicar filtro de variedad
        if (selectedVariedad && semilla.variedad !== selectedVariedad) {
            return false;
        }
        // Aplicar filtro de búsqueda
        return (
            semilla.variedad?.toLowerCase().includes(searchText.toLowerCase()) ||
            semilla.origen?.toLowerCase().includes(searchText.toLowerCase())
        );
    });

    // Manejar descarga de archivo (CA-03)
    const handleDownloadFile = async (semilla: Semilla) => {
        if (!semilla.anexo_nombre) {
            alert('No hay archivo adjunto');
            return;
        }

        try {
            // Descargar archivo desde el backend
            const response = await fetch(`${Config.API_URL}/semillas/${semilla.id}/anexo`);
            
            if (!response.ok) {
                throw new Error(`Error en descarga: ${response.status}`);
            }
            
            // Obtener el blob del archivo
            const blob = await response.blob();
            
            // Crear URL temporal
            const url = URL.createObjectURL(blob);
            
            // Crear elemento temporal de descarga
            const link = document.createElement('a');
            link.href = url;
            link.download = semilla.anexo_nombre;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpiar URL temporal
            URL.revokeObjectURL(url);
            
            console.log(`✓ Archivo descargado: ${semilla.anexo_nombre}`);
        } catch (err) {
            alert(`Error al descargar: ${semilla.anexo_nombre}`);
            console.error('Download error:', err);
        }
    };

    // Formatear tamaño de archivo
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    // Formatear fecha
    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'Sin fecha';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

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
                            Inventario de Semillas
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

            {/* Filters Section */}
            <View style={styles.filtersSection}>
                {/* Search Bar */}
                <SearchBar
                    placeholder="Buscar por variedad u origen..."
                    value={searchText}
                    onChangeText={setSearchText}
                    style={styles.searchBar}
                />

                {/* Variedad Filter */}
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        {
                            backgroundColor: colors.surfaceContainerLow,
                            borderColor: colors.outlineVariant,
                        },
                    ]}
                    onPress={() => setShowVariedadFilter(!showVariedadFilter)}
                >
                    <MaterialCommunityIcons name="leaf" size={18} color={colors.secondary} />
                    <Text
                        style={[
                            styles.filterButtonText,
                            { color: selectedVariedad ? colors.onSurface : colors.onSurfaceVariant },
                        ]}
                    >
                        {selectedVariedad || 'Filtrar por Variedad'}
                    </Text>
                    <MaterialCommunityIcons
                        name={showVariedadFilter ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.onSurfaceVariant}
                    />
                </TouchableOpacity>

                {/* Variedad Dropdown */}
                {showVariedadFilter && (
                    <View
                        style={[
                            styles.filterDropdown,
                            { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedVariedad(null);
                                setShowVariedadFilter(false);
                            }}
                            style={styles.filterOption}
                        >
                            <Text
                                style={[
                                    styles.filterOptionText,
                                    { color: !selectedVariedad ? colors.primary : colors.onSurface },
                                ]}
                            >
                                Todas las variedades
                            </Text>
                        </TouchableOpacity>

                        {varietades.map((variedad) => (
                            <TouchableOpacity
                                key={variedad}
                                onPress={() => {
                                    setSelectedVariedad(variedad);
                                    setShowVariedadFilter(false);
                                }}
                                style={styles.filterOption}
                            >
                                <Text
                                    style={[
                                        styles.filterOptionText,
                                        { color: selectedVariedad === variedad ? colors.primary : colors.onSurface },
                                    ]}
                                >
                                    {variedad}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

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
                                        icon="scent"
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
                                {/* Fecha de Registro (CA-01) */}
                                {semilla.fecha_creacion && (
                                    <InfoRow
                                        icon="calendar"
                                        label="Registro"
                                        value={formatDate(semilla.fecha_creacion)}
                                    />
                                )}
                            </View>

                            {/* File Info Section */}
                            {semilla.anexo_nombre && (
                                <View
                                    style={[
                                        styles.attachmentInfo,
                                        { backgroundColor: colors.primaryContainer },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name="file-document"
                                        size={16}
                                        color={colors.onPrimaryContainer}
                                    />
                                    <View style={styles.attachmentDetails}>
                                        <Text
                                            style={[styles.attachmentName, { color: colors.onPrimaryContainer }]}
                                            numberOfLines={1}
                                        >
                                            {semilla.anexo_nombre}
                                        </Text>
                                        <Text
                                            style={[styles.attachmentSize, { color: colors.onPrimaryContainer }]}
                                        >
                                            {formatFileSize(semilla.anexo_tamano || 0)}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDownloadFile(semilla)}
                                        style={styles.downloadButton}
                                    >
                                        <MaterialCommunityIcons
                                            name="download"
                                            size={20}
                                            color={colors.onPrimaryContainer}
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Card Footer */}
                            <View style={[styles.cardFooter, { borderTopColor: colors.outlineVariant }]}>
                                <Button
                                    title="Editar"
                                    onPress={() => router.push({ pathname: '/semilla/[id]' as any, params: { id: semilla.id } })}
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
    filtersSection: {
        paddingVertical: Spacing.lg,
        gap: Spacing.md,
    },
    searchBar: {
        marginBottom: Spacing.sm,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    filterDropdown: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginTop: -Spacing.md,
    },
    filterOption: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.outlineVariant,
    },
    filterOptionText: {
        fontSize: 14,
        fontWeight: '500',
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
    attachmentButton: {
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
    attachmentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.lg,
    },
    attachmentDetails: {
        flex: 1,
    },
    attachmentName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    attachmentSize: {
        fontSize: 11,
        fontWeight: '400',
        opacity: 0.8,
    },
    downloadButton: {
        padding: Spacing.xs,
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

