import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Animated,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { Zone } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../styles/theme';
import { API_CONFIG } from '../../constants/api';

interface Event {
    id: number;
    type: string;
    description: string;
    timestamp: string;
    zoneId: number;
    mode?: 'automatic' | 'manual';
    duration?: number;
    metadata?: {
        automatic?: boolean;
        duration?: number;
        soilMoisture?: number;
        threshold?: number;
        tankLevel?: number;
        [key: string]: any;
    };
}

export default function HistoryScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [events, setEvents] = useState<Event[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
    const [showZoneModal, setShowZoneModal] = useState(false);
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!loading) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    }, [loading]);

    const loadData = async () => {
        try {
            const [zonesRes, eventsRes] = await Promise.all([
                fetch(`${API_CONFIG.BASE_URL}/zones/${user?.id}`),
                fetch(`${API_CONFIG.BASE_URL}/events/${user?.id}`)
            ]);

            if (zonesRes.ok) {
                const zonesData = await zonesRes.json();
                setZones(zonesData);
            }

            if (eventsRes.ok) {
                const eventsData = await eventsRes.json();
                
                // Enriquecer eventos con información de modo
                const enrichedEvents = eventsData.map((event: Event) => {
                    const isAutomatic = event.type.includes('AUTO') || 
                                        event.metadata?.automatic === true;
                    return {
                        ...event,
                        mode: isAutomatic ? 'automatic' : 'manual',
                        duration: event.metadata?.duration,
                    };
                });

                setEvents(enrichedEvents);
            } else {
                // Si no hay eventos aún, mostrar lista vacía
                setEvents([]);
            }
        } catch (error) {
            console.error('Error loading history:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = selectedZoneId
        ? events.filter(e => e.zoneId === selectedZoneId)
        : events;

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const eventDate = new Date(timestamp);
        const diffMs = now.getTime() - eventDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return diffDays === 1 ? 'Ayer' : `Hace ${diffDays} días`;
        } else if (diffHours > 0) {
            return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return `Hace ${diffMins} min`;
        }
    };

    const getEventIcon = (type: string) => {
        if (type.includes('RIEGO')) return 'water';
        if (type.includes('ALERTA') || type.includes('TANQUE')) return 'warning';
        if (type.includes('CONFIG')) return 'settings';
        if (type.includes('ZONA')) return 'leaf';
        return 'flash';
    };

    const getEventColor = (type: string) => {
        if (type.includes('RIEGO')) return Colors.emerald[600];
        if (type.includes('ALERTA') || type.includes('TANQUE')) return Colors.red[500];
        if (type.includes('CONFIG')) return Colors.blue[500];
        if (type.includes('ZONA')) return Colors.orange[500];
        return Colors.purple[600];
    };

    const getIconBackground = (type: string) => {
        if (type.includes('RIEGO')) return Colors.emerald[50];
        if (type.includes('ALERTA') || type.includes('TANQUE')) return Colors.red[50];
        if (type.includes('CONFIG')) return Colors.blue[50];
        if (type.includes('ZONA')) return Colors.orange[50];
        return Colors.purple[50];
    };

    const renderEventItem = ({ item, index }: { item: Event; index: number }) => {
        const zone = zones.find(z => z.id === item.zoneId);
        if (!zone) return null;

        return (
            <Animated.View
                style={[
                    styles.eventCard,
                    { backgroundColor: colors.card },
                    {
                        opacity: fadeAnim,
                        transform: [{
                            translateY: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                            })
                        }]
                    }
                ]}
            >
                <View style={styles.eventContent}>
                    {/* Icon */}
                    <View style={[styles.eventIcon, { backgroundColor: getIconBackground(item.type) }]}>
                        <Ionicons name={getEventIcon(item.type) as any} size={24} color={getEventColor(item.type)} />
                    </View>

                    {/* Event Info */}
                    <View style={styles.eventInfo}>
                        <View style={styles.eventHeader}>
                            <Text style={[styles.zoneName, { color: colors.text }]}>{zone.name}</Text>
                            {item.mode && (
                                <View style={[
                                    styles.modeBadge,
                                    { backgroundColor: item.mode === 'automatic' ? Colors.emerald[50] : Colors.blue[50] }
                                ]}>
                                    <Text style={[
                                        styles.modeText,
                                        { color: item.mode === 'automatic' ? Colors.emerald[600] : Colors.blue[600] }
                                    ]}>
                                        {item.mode === 'automatic' ? 'Automático' : 'Manual'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.eventDescription, { color: colors.textSecondary }]}>{item.description}</Text>
                        <View style={styles.eventMeta}>
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{getTimeAgo(item.timestamp)}</Text>
                            </View>
                            {item.duration && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="water-outline" size={14} color={colors.textSecondary} />
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.duration} min de riego</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const selectedZoneName = selectedZoneId
        ? zones.find(z => z.id === selectedZoneId)?.name
        : `Todas las zonas (${zones.length})`;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Header />

            <View style={styles.content}>
                {/* Page Title */}
                <View style={[styles.pageHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Historial de Eventos</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Registro de actividad del sistema de riego</Text>
                </View>

                {/* Filter Dropdown */}
                <TouchableOpacity
                    style={[styles.filterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setShowZoneModal(true)}
                >
                    <Ionicons name="funnel-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.filterText, { color: colors.text }]}>{selectedZoneName}</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Events List */}
                <FlatList
                    data={filteredEvents}
                    renderItem={renderEventItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={64} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay eventos registrados</Text>
                        </View>
                    }
                />
            </View>

            {/* Zone Filter Modal */}
            <Modal
                visible={showZoneModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowZoneModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowZoneModal(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Filtrar por zona</Text>
                            <TouchableOpacity onPress={() => setShowZoneModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.zoneOption,
                                { borderBottomColor: colors.border },
                                selectedZoneId === null && styles.zoneOptionActive
                            ]}
                            onPress={() => {
                                setSelectedZoneId(null);
                                setShowZoneModal(false);
                            }}
                        >
                            <Text style={[
                                styles.zoneOptionText,
                                { color: colors.text },
                                selectedZoneId === null && styles.zoneOptionTextActive
                            ]}>
                                Todas las zonas ({zones.length})
                            </Text>
                            {selectedZoneId === null && (
                                <Ionicons name="checkmark" size={24} color={Colors.emerald[600]} />
                            )}
                        </TouchableOpacity>

                        {zones.map(zone => (
                            <TouchableOpacity
                                key={zone.id}
                                style={[
                                    styles.zoneOption,
                                    { borderBottomColor: colors.border },
                                    selectedZoneId === zone.id && styles.zoneOptionActive
                                ]}
                                onPress={() => {
                                    setSelectedZoneId(zone.id);
                                    setShowZoneModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.zoneOptionText,
                                    { color: colors.text },
                                    selectedZoneId === zone.id && styles.zoneOptionTextActive
                                ]}>
                                    {zone.name}
                                </Text>
                                {selectedZoneId === zone.id && (
                                    <Ionicons name="checkmark" size={24} color={Colors.emerald[600]} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    pageHeader: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: FontSizes['3xl'],
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: FontSizes.sm,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        borderRadius: BorderRadius.xl,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    filterText: {
        flex: 1,
        fontSize: FontSizes.base,
        fontWeight: '700',
    },
    listContent: {
        padding: Spacing.lg,
        paddingTop: 0,
    },
    eventCard: {
        borderRadius: BorderRadius.xxl,
        marginBottom: Spacing.md,
        padding: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    eventContent: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    eventIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventInfo: {
        flex: 1,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    zoneName: {
        fontSize: FontSizes.lg,
        fontWeight: '800',
    },
    modeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    modeText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
    eventDescription: {
        fontSize: FontSizes.sm,
        marginBottom: 8,
        lineHeight: 20,
    },
    eventMeta: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: FontSizes.xs,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl * 2,
    },
    emptyText: {
        marginTop: Spacing.md,
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
        paddingBottom: Spacing.xl,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '800',
    },
    zoneOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    zoneOptionActive: {
        backgroundColor: Colors.emerald[50],
    },
    zoneOptionText: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    zoneOptionTextActive: {
        color: Colors.emerald[700],
        fontWeight: '700',
    },
});
