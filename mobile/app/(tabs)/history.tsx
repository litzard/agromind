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
    duration?: number; // in minutes
}

export default function HistoryScreen() {
    const { user } = useAuth();
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

            if (zonesRes.ok && eventsRes.ok) {
                const zonesData = await zonesRes.json();
                const eventsData = await eventsRes.json();

                // Enrich events with mode info (you can also get this from backend)
                const enrichedEvents = eventsData.map((event: Event) => ({
                    ...event,
                    mode: event.type.includes('AUTO') || event.type.includes('Automático') ? 'automatic' : 'manual',
                    duration: Math.floor(Math.random() * 20) + 5, // Mock duration, replace with real data
                }));

                setZones(zonesData);
                setEvents(enrichedEvents);
            }
        } catch (error) {
            console.error('Error loading history:', error);
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
        if (type.includes('ALERTA')) return 'warning';
        if (type.includes('CONFIG')) return 'settings';
        return 'flash';
    };

    const getEventColor = (type: string) => {
        if (type.includes('RIEGO')) return Colors.emerald[600];
        if (type.includes('ALERTA')) return Colors.red[500];
        if (type.includes('CONFIG')) return Colors.blue[500];
        return Colors.purple[600];
    };

    const getIconBackground = (type: string) => {
        if (type.includes('RIEGO')) return Colors.emerald[50];
        if (type.includes('ALERTA')) return Colors.red[50];
        if (type.includes('CONFIG')) return Colors.blue[50];
        return Colors.purple[50];
    };

    const renderEventItem = ({ item, index }: { item: Event; index: number }) => {
        const zone = zones.find(z => z.id === item.zoneId);
        if (!zone) return null;

        return (
            <Animated.View
                style={[
                    styles.eventCard,
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
                            <Text style={styles.zoneName}>{zone.name}</Text>
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
                        <Text style={styles.eventDescription}>{item.description}</Text>
                        <View style={styles.eventMeta}>
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={14} color={Colors.gray[500]} />
                                <Text style={styles.metaText}>{getTimeAgo(item.timestamp)}</Text>
                            </View>
                            {item.duration && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="water-outline" size={14} color={Colors.gray[500]} />
                                    <Text style={styles.metaText}>{item.duration} min de riego</Text>
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.emerald[600]} />
            </View>
        );
    }

    const selectedZoneName = selectedZoneId
        ? zones.find(z => z.id === selectedZoneId)?.name
        : `Todas las zonas (${zones.length})`;

    return (
        <View style={styles.container}>
            <Header />

            <View style={styles.content}>
                {/* Page Title */}
                <View style={styles.pageHeader}>
                    <Text style={styles.title}>Historial de Eventos</Text>
                    <Text style={styles.subtitle}>Registro de actividad del sistema de riego</Text>
                </View>

                {/* Filter Dropdown */}
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowZoneModal(true)}
                >
                    <Ionicons name="funnel-outline" size={20} color={Colors.gray[600]} />
                    <Text style={styles.filterText}>{selectedZoneName}</Text>
                    <Ionicons name="chevron-down" size={20} color={Colors.gray[400]} />
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
                            <Ionicons name="calendar-outline" size={64} color={Colors.gray[300]} />
                            <Text style={styles.emptyText}>No hay eventos registrados</Text>
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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filtrar por zona</Text>
                            <TouchableOpacity onPress={() => setShowZoneModal(false)}>
                                <Ionicons name="close" size={24} color={Colors.gray[600]} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.zoneOption,
                                selectedZoneId === null && styles.zoneOptionActive
                            ]}
                            onPress={() => {
                                setSelectedZoneId(null);
                                setShowZoneModal(false);
                            }}
                        >
                            <Text style={[
                                styles.zoneOptionText,
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
                                    selectedZoneId === zone.id && styles.zoneOptionActive
                                ]}
                                onPress={() => {
                                    setSelectedZoneId(zone.id);
                                    setShowZoneModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.zoneOptionText,
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
        backgroundColor: Colors.gray[50],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.gray[50],
    },
    content: {
        flex: 1,
    },
    pageHeader: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    title: {
        fontSize: FontSizes['3xl'],
        fontWeight: '700',
        color: Colors.gray[900],
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FontSizes.sm,
        color: Colors.gray[500],
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: '#fff',
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        borderColor: Colors.gray[200],
    },
    filterText: {
        flex: 1,
        fontSize: FontSizes.base,
        fontWeight: '600',
        color: Colors.gray[700],
    },
    listContent: {
        padding: Spacing.lg,
        paddingTop: 0,
    },
    eventCard: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
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
        fontWeight: '700',
        color: Colors.gray[900],
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
        color: Colors.gray[600],
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
        color: Colors.gray[500],
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl * 2,
    },
    emptyText: {
        marginTop: Spacing.md,
        fontSize: FontSizes.base,
        color: Colors.gray[500],
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Spacing.xl,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    modalTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.gray[900],
    },
    zoneOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[50],
    },
    zoneOptionActive: {
        backgroundColor: Colors.emerald[50],
    },
    zoneOptionText: {
        fontSize: FontSizes.base,
        fontWeight: '500',
        color: Colors.gray[700],
    },
    zoneOptionTextActive: {
        color: Colors.emerald[700],
        fontWeight: '700',
    },
});
