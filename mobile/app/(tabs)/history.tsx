import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Animated,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Zone } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../styles/theme';
import { API_CONFIG } from '../../constants/api';

interface Event {
    id: number;
    type: string;
    description: string;
    timestamp: string;
    zoneId: number;
}

export default function HistoryScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [events, setEvents] = useState<Event[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
    const [showFilter, setShowFilter] = useState(false);

    // Animations
    const fadeAnim = new Animated.Value(0);
    const filterHeight = new Animated.Value(0);

    useEffect(() => {
        loadData();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const toggleFilter = () => {
        const toValue = showFilter ? 0 : 1;
        setShowFilter(!showFilter);
        Animated.spring(filterHeight, {
            toValue,
            useNativeDriver: false,
            friction: 8,
        }).start();
    };

    const loadData = async () => {
        try {
            const [zonesRes, eventsRes] = await Promise.all([
                fetch(`${API_CONFIG.BASE_URL}/zones/${user?.id}`),
                fetch(`${API_CONFIG.BASE_URL}/events/${user?.id}`)
            ]);

            if (zonesRes.ok && eventsRes.ok) {
                const zonesData = await zonesRes.json();
                const eventsData = await eventsRes.json();
                setZones(zonesData);
                setEvents(eventsData);
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

    const getEventIcon = (type: string) => {
        if (type.includes('RIEGO')) return 'water';
        if (type.includes('ALERTA')) return 'warning';
        if (type.includes('CONFIG')) return 'settings';
        return 'information-circle';
    };

    const getEventColor = (type: string) => {
        if (type.includes('RIEGO')) return '#3B82F6';
        if (type.includes('ALERTA')) return '#EF4444';
        if (type.includes('CONFIG')) return colors.textSecondary;
        return colors.primary;
    };

    const renderEventItem = ({ item, index }: { item: Event; index: number }) => {
        const zone = zones.find(z => z.id === item.zoneId);

        return (
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{
                        translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0]
                        })
                    }]
                }}
            >
                <Card style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: getEventColor(item.type) + '20' }]}>
                            <Ionicons name={getEventIcon(item.type) as any} size={20} color={getEventColor(item.type)} />
                        </View>
                        <View style={styles.eventInfo}>
                            <Text style={[styles.eventType, { color: colors.text }]}>{item.type}</Text>
                            <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
                                {new Date(item.timestamp).toLocaleString()}
                            </Text>
                        </View>
                        {zone && <Badge type={zone.type} />}
                    </View>
                    <Text style={[styles.eventDescription, { color: colors.textSecondary }]}>{item.description}</Text>
                    {zone && (
                        <View style={styles.zoneTag}>
                            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                            <Text style={[styles.zoneTagName, { color: colors.textSecondary }]}>{zone.name}</Text>
                        </View>
                    )}
                </Card>
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={[styles.title, { color: colors.text }]}>📜 Historial</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Registro de actividad</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            { backgroundColor: showFilter ? colors.primary + '15' : colors.background },
                            showFilter && styles.filterButtonActive
                        ]}
                        onPress={toggleFilter}
                    >
                        <Ionicons
                            name={showFilter ? "funnel" : "funnel-outline"}
                            size={20}
                            color={showFilter ? colors.primary : colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                <Animated.View style={[
                    styles.filterContainer,
                    {
                        height: filterHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 120] // Adjust based on content
                        }),
                        opacity: filterHeight
                    }
                ]}>
                    <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filtrar por zona:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: selectedZoneId === null ? colors.primary + '15' : colors.background,
                                    borderColor: selectedZoneId === null ? colors.primary : colors.border
                                }
                            ]}
                            onPress={() => setSelectedZoneId(null)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                { color: selectedZoneId === null ? colors.primary : colors.textSecondary }
                            ]}>Todas</Text>
                        </TouchableOpacity>
                        {zones.map(zone => (
                            <TouchableOpacity
                                key={zone.id}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedZoneId === zone.id ? colors.primary + '15' : colors.background,
                                        borderColor: selectedZoneId === zone.id ? colors.primary : colors.border
                                    }
                                ]}
                                onPress={() => setSelectedZoneId(zone.id)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: selectedZoneId === zone.id ? colors.primary : colors.textSecondary }
                                ]}>{zone.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Animated.View>
            </View>

            <FlatList
                data={filteredEvents}
                renderItem={renderEventItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={48} color={colors.border} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay eventos registrados</Text>
                    </View>
                }
            />
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
    header: {
        padding: Spacing.lg,
        paddingTop: Spacing.xl,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: FontSizes['3xl'],
        fontWeight: '700',
    },
    subtitle: {
        fontSize: FontSizes.sm,
        marginTop: 4,
    },
    filterButton: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    filterButtonActive: {
    },
    filterContainer: {
        overflow: 'hidden',
    },
    filterLabel: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    filterScroll: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        marginRight: Spacing.sm,
        borderWidth: 1,
    },
    filterChipActive: {
    },
    filterChipText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    filterChipTextActive: {
    },
    listContent: {
        padding: Spacing.lg,
    },
    eventCard: {
        marginBottom: Spacing.md,
    },
    eventHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    eventInfo: {
        flex: 1,
    },
    eventType: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
        color: Colors.gray[800],
    },
    eventTime: {
        fontSize: FontSizes.xs,
        color: Colors.gray[500],
    },
    eventDescription: {
        fontSize: FontSizes.base,
        color: Colors.gray[700],
        marginBottom: Spacing.sm,
    },
    zoneTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    zoneTagName: {
        fontSize: FontSizes.xs,
        color: Colors.gray[500],
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xxl,
    },
    emptyText: {
        marginTop: Spacing.md,
        fontSize: FontSizes.base,
        color: Colors.gray[500],
    },
});
