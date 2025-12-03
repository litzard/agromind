import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline, Polygon, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Zone, StatisticsResponse, DailyIrrigation } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../styles/theme';
import { API_CONFIG } from '../../constants/api';

const { width } = Dimensions.get('window');

const TIME_RANGES = [
    { label: '7 días', value: 7 },
    { label: '30 días', value: 30 },
    { label: '90 días', value: 90 },
];

// Mini sparkline chart component
const MiniSparkline = ({ data, color = Colors.emerald[500], height = 40 }: { data: number[]; color?: string; height?: number }) => {
    if (!data || data.length === 0) return null;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const chartWidth = 100;
    
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * chartWidth;
        const y = height - ((value - min) / range) * (height - 4);
        return `${x},${y}`;
    }).join(' ');
    
    const polygonPoints = `0,${height} ${points} ${chartWidth},${height}`;
    
    return (
        <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="none">
            <Defs>
                <SvgLinearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <Stop offset="100%" stopColor={color} stopOpacity="0" />
                </SvgLinearGradient>
            </Defs>
            <Polygon
                points={polygonPoints}
                fill={`url(#gradient-${color.replace('#', '')})`}
            />
            <Polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
};

export default function StatisticsScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
    const [selectedRange, setSelectedRange] = useState(30);
    const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        if (user?.id) {
            loadStatistics();
        }
    }, [selectedZoneId, selectedRange, user?.id]);

    const loadData = async () => {
        try {
            // Cargar zonas
            const zonesRes = await fetch(`${API_CONFIG.BASE_URL}/zones/${user?.id}`);
            if (zonesRes.ok) {
                const zonesData = await zonesRes.json();
                setZones(zonesData);
            }
            await loadStatistics();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDefaultStatistics = (): StatisticsResponse => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push({
                date: date.toISOString().split('T')[0],
                day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
                count: 0
            });
        }
        
        return {
            summary: {
                totalIrrigations: 0,
                autoIrrigations: 0,
                manualIrrigations: 0,
                configChanges: 0,
                totalWaterUsed: 0,
                waterSaved: 0,
                avgDailyIrrigations: 0,
                avgWaterPerDay: 0,
            },
            dailyIrrigations: last7Days,
            recentEvents: [],
            period: {
                days: selectedRange,
                from: new Date(Date.now() - selectedRange * 24 * 60 * 60 * 1000).toISOString(),
                to: new Date().toISOString(),
            }
        };
    };

    const loadStatistics = async () => {
        if (!user?.id) {
            setStatistics(getDefaultStatistics());
            return;
        }
        
        try {
            const zoneParam = selectedZoneId !== 'all' ? `&zoneId=${selectedZoneId}` : '';
            const url = `${API_CONFIG.BASE_URL}/events/${user.id}/statistics?days=${selectedRange}${zoneParam}`;
            console.log('Fetching statistics from:', url);
            
            const res = await fetch(url);
            console.log('Statistics response status:', res.status);
            
            if (res.ok) {
                const data = await res.json();
                console.log('Statistics data:', JSON.stringify(data, null, 2));
                setStatistics(data);
            } else {
                console.log('Statistics error response:', await res.text());
                // Si hay error, usar datos por defecto
                setStatistics(getDefaultStatistics());
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            // Si hay error de red, usar datos por defecto
            setStatistics(getDefaultStatistics());
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getMaxCount = (data: DailyIrrigation[]) => {
        return Math.max(...data.map(d => d.count), 1);
    };

    // Generate sparkline data from daily irrigations
    const getSparklineData = () => {
        if (!statistics?.dailyIrrigations) return [];
        return statistics.dailyIrrigations.map(d => d.count);
    };

    const StatCard = ({ 
        icon, 
        label, 
        value, 
        color, 
        suffix = '',
        sparkline,
        trend,
    }: { 
        icon: string; 
        label: string; 
        value: number | string; 
        color: string; 
        suffix?: string;
        sparkline?: number[];
        trend?: { value: number; positive: boolean };
    }) => (
        <Card style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
                {trend && (
                    <View style={[styles.trendBadge, { backgroundColor: trend.positive ? Colors.emerald[50] : Colors.red[50] }]}>
                        <Ionicons 
                            name={trend.positive ? 'trending-up' : 'trending-down'} 
                            size={12} 
                            color={trend.positive ? Colors.emerald[500] : Colors.red[500]} 
                        />
                        <Text style={[styles.trendText, { color: trend.positive ? Colors.emerald[600] : Colors.red[500] }]}>
                            {trend.value}%
                        </Text>
                    </View>
                )}
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
            <View style={styles.statValueRow}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                    {value}
                </Text>
                {suffix && <Text style={[styles.statSuffix, { color: colors.textSecondary }]}>{suffix}</Text>}
            </View>
            {sparkline && sparkline.length > 0 && (
                <View style={styles.sparklineContainer}>
                    <MiniSparkline data={sparkline} color={color} height={36} />
                </View>
            )}
        </Card>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Header />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.emerald[600]} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Header />
            
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Título */}
                <View style={styles.headerSection}>
                    <Text style={[styles.title, { color: colors.text }]}>Estadísticas</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Analiza el rendimiento de tus zonas
                    </Text>
                </View>

                {/* Filtros */}
                <View style={styles.filtersSection}>
                    {/* Selector de zona */}
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.zoneSelector}
                    >
                        <TouchableOpacity
                            style={[
                                styles.zoneChip,
                                selectedZoneId === 'all' && styles.zoneChipActive,
                                { backgroundColor: selectedZoneId === 'all' ? Colors.emerald[600] : colors.card }
                            ]}
                            onPress={() => setSelectedZoneId('all')}
                        >
                            <Text style={[
                                styles.zoneChipText,
                                { color: selectedZoneId === 'all' ? '#fff' : colors.text }
                            ]}>
                                Todas
                            </Text>
                        </TouchableOpacity>
                        {zones.map(zone => (
                            <TouchableOpacity
                                key={zone.id}
                                style={[
                                    styles.zoneChip,
                                    selectedZoneId === zone.id.toString() && styles.zoneChipActive,
                                    { backgroundColor: selectedZoneId === zone.id.toString() ? Colors.emerald[600] : colors.card }
                                ]}
                                onPress={() => setSelectedZoneId(zone.id.toString())}
                            >
                                <Text style={[
                                    styles.zoneChipText,
                                    { color: selectedZoneId === zone.id.toString() ? '#fff' : colors.text }
                                ]}>
                                    {zone.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Selector de rango */}
                    <View style={styles.rangeSelector}>
                        {TIME_RANGES.map(range => (
                            <TouchableOpacity
                                key={range.value}
                                style={[
                                    styles.rangeChip,
                                    selectedRange === range.value && styles.rangeChipActive,
                                    { backgroundColor: selectedRange === range.value ? Colors.emerald[600] : colors.card }
                                ]}
                                onPress={() => setSelectedRange(range.value)}
                            >
                                <Text style={[
                                    styles.rangeChipText,
                                    { color: selectedRange === range.value ? '#fff' : colors.textSecondary }
                                ]}>
                                    {range.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Stats Grid */}
                {statistics && (
                    <>
                        <View style={styles.statsGrid}>
                            <StatCard
                                icon="water"
                                label="Total Riegos"
                                value={statistics.summary.totalIrrigations}
                                color={Colors.emerald[500]}
                                trend={{ value: 12, positive: true }}
                                sparkline={getSparklineData()}
                            />
                            <StatCard
                                icon="time"
                                label="Promedio Diario"
                                value={statistics.summary.avgDailyIrrigations}
                                color={Colors.blue[500]}
                                suffix="riegos/día"
                            />
                            <StatCard
                                icon="flash"
                                label="Automáticos"
                                value={statistics.summary.autoIrrigations}
                                color={Colors.emerald[500]}
                            />
                            <StatCard
                                icon="hand-left"
                                label="Manuales"
                                value={statistics.summary.manualIrrigations}
                                color={Colors.orange[500]}
                            />
                        </View>

                        {/* Gráfico de barras */}
                        <Card style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.chartHeader}>
                                <View>
                                    <Text style={[styles.chartTitle, { color: colors.text }]}>
                                        Riegos por Día
                                    </Text>
                                    <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                                        Distribución semanal
                                    </Text>
                                </View>
                                <View style={[styles.chartIconContainer, { backgroundColor: Colors.emerald[50] }]}>
                                    <Ionicons name="bar-chart" size={20} color={Colors.emerald[600]} />
                                </View>
                            </View>
                            <View style={styles.barChart}>
                                {statistics.dailyIrrigations.map((item, index) => {
                                    const maxCount = getMaxCount(statistics.dailyIrrigations);
                                    const heightPercent = (item.count / maxCount) * 100;
                                    
                                    return (
                                        <View key={index} style={styles.barContainer}>
                                            <Text style={[styles.barValue, { color: colors.text }]}>
                                                {item.count > 0 ? item.count : ''}
                                            </Text>
                                            <View style={styles.barWrapper}>
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        {
                                                            height: `${Math.max(heightPercent, 5)}%`,
                                                            backgroundColor: item.count > 0 
                                                                ? Colors.emerald[500] 
                                                                : Colors.gray[200],
                                                        }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                                                {item.day}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </Card>

                        {/* Water Savings Card - Gradient */}
                        <LinearGradient
                            colors={[Colors.emerald[500], '#14B8A6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.waterSavingsCard}
                        >
                            <View style={styles.waterSavingsContent}>
                                <View style={styles.waterSavingsTextContainer}>
                                    <Text style={styles.waterSavingsLabel}>Ahorro estimado de agua</Text>
                                    <View style={styles.waterSavingsValueRow}>
                                        <Text style={styles.waterSavingsValue}>{statistics.summary.waterSaved}</Text>
                                        <Text style={styles.waterSavingsUnit}>litros</Text>
                                    </View>
                                    <Text style={styles.waterSavingsDescription}>
                                        Gracias al riego inteligente basado en sensores y clima
                                    </Text>
                                </View>
                                <View style={styles.waterSavingsIconContainer}>
                                    <Ionicons name="water" size={48} color="#fff" />
                                </View>
                            </View>
                        </LinearGradient>

                        {/* Actividad reciente */}
                        <Card style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.chartHeader}>
                                <View>
                                    <Text style={[styles.activityTitle, { color: colors.text }]}>
                                        Actividad Reciente
                                    </Text>
                                    <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                                        Últimos eventos
                                    </Text>
                                </View>
                                <View style={[styles.chartIconContainer, { backgroundColor: Colors.blue[50] }]}>
                                    <Ionicons name="time" size={20} color={Colors.blue[600]} />
                                </View>
                            </View>
                            
                            {statistics.recentEvents.length === 0 ? (
                                <View style={styles.emptyActivity}>
                                    <Ionicons name="time-outline" size={40} color={Colors.gray[300]} />
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        Sin eventos registrados
                                    </Text>
                                </View>
                            ) : (
                                statistics.recentEvents.slice(0, 5).map((event, index) => (
                                    <View 
                                        key={event.id} 
                                        style={[
                                            styles.activityItem,
                                            index < statistics.recentEvents.slice(0, 5).length - 1 && styles.activityItemBorder
                                        ]}
                                    >
                                        <View style={[
                                            styles.activityIcon,
                                            { backgroundColor: getEventColor(event.type) + '20' }
                                        ]}>
                                            <Ionicons 
                                                name={getEventIcon(event.type) as any} 
                                                size={16} 
                                                color={getEventColor(event.type)} 
                                            />
                                        </View>
                                        <View style={styles.activityContent}>
                                            <Text style={[styles.activityDescription, { color: colors.text }]} numberOfLines={1}>
                                                {event.description}
                                            </Text>
                                            <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                                                {formatTimestamp(event.timestamp)}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </Card>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const getEventIcon = (type: string): string => {
    if (type.includes('RIEGO') || type.includes('IRRIGATION')) return 'water';
    if (type.includes('CONFIG')) return 'settings';
    if (type.includes('VACATION')) return 'airplane';
    if (type.includes('SCHEDULE')) return 'calendar';
    if (type.includes('ZONA')) return 'leaf';
    return 'information-circle';
};

const getEventColor = (type: string): string => {
    if (type.includes('RIEGO') || type.includes('IRRIGATION')) return Colors.blue[500];
    if (type.includes('CONFIG')) return Colors.orange[500];
    if (type.includes('VACATION')) return Colors.purple[500];
    if (type.includes('SCHEDULE')) return Colors.indigo[500];
    return Colors.gray[500];
};

const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSection: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: FontSizes.base,
        marginTop: Spacing.xs,
    },
    filtersSection: {
        marginBottom: Spacing.lg,
    },
    zoneSelector: {
        marginBottom: Spacing.md,
    },
    zoneChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        marginRight: Spacing.sm,
    },
    zoneChipActive: {
        shadowColor: Colors.emerald[600],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    zoneChipText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    rangeSelector: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    rangeChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
    },
    rangeChipActive: {},
    rangeChipText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    statCard: {
        width: (width - Spacing.lg * 2 - Spacing.md) / 2,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        gap: 2,
    },
    trendText: {
        fontSize: 10,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: FontSizes.xs,
        marginBottom: 2,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    statSuffix: {
        fontSize: FontSizes.xs,
    },
    sparklineContainer: {
        marginTop: Spacing.sm,
        marginHorizontal: -Spacing.sm,
    },
    chartCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    chartTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
    },
    chartSubtitle: {
        fontSize: FontSizes.xs,
        marginTop: 2,
    },
    chartIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    barChart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
    },
    barWrapper: {
        flex: 1,
        width: '60%',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: BorderRadius.sm,
        minHeight: 4,
    },
    barLabel: {
        fontSize: 10,
        marginTop: Spacing.xs,
        textTransform: 'capitalize',
    },
    barValue: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 4,
        height: 14,
    },
    // Water Savings Card
    waterSavingsCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    waterSavingsContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    waterSavingsTextContainer: {
        flex: 1,
    },
    waterSavingsLabel: {
        fontSize: FontSizes.sm,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginBottom: 4,
    },
    waterSavingsValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    waterSavingsValue: {
        fontSize: 40,
        fontWeight: '800',
        color: '#fff',
    },
    waterSavingsUnit: {
        fontSize: FontSizes.base,
        color: 'rgba(255,255,255,0.8)',
    },
    waterSavingsDescription: {
        fontSize: FontSizes.xs,
        color: 'rgba(255,255,255,0.7)',
        marginTop: Spacing.sm,
    },
    waterSavingsIconContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
    },
    summaryCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    summaryTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        marginBottom: Spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: Spacing.lg,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    summaryLabel: {
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    summaryDivider: {
        width: 1,
        backgroundColor: Colors.gray[200],
    },
    waterUsageBar: {
        height: 8,
        borderRadius: BorderRadius.full,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    waterUsageFill: {
        height: '100%',
    },
    waterSavedFill: {
        flex: 1,
        height: '100%',
    },
    waterLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.xl,
        marginTop: Spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: FontSizes.xs,
    },
    activityCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
    },
    activityTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        marginBottom: Spacing.lg,
    },
    emptyActivity: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyText: {
        marginTop: Spacing.md,
        fontSize: FontSizes.sm,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    activityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    activityContent: {
        flex: 1,
    },
    activityDescription: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    activityTime: {
        fontSize: FontSizes.xs,
        marginTop: 2,
    },
});
