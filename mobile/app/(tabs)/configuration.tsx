import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTutorial } from '../../context/TutorialContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Header } from '../../components/Header';
import { TutorialOverlay } from '../../components/TutorialOverlay';
import { Zone } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../styles/theme';
import { API_CONFIG } from '../../constants/api';

export default function ConfigurationScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const { startTutorial, setCurrentScreen } = useTutorial();
    const router = useRouter();
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [loading, setLoading] = useState(true);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const hasAnimated = React.useRef(false);

    useFocusEffect(
        React.useCallback(() => {
            if (!hasAnimated.current) {
                loadZones();
            }
            setCurrentScreen('configuration');
        }, [])
    );

    useEffect(() => {
        if (!loading && zones.length > 0 && !hasAnimated.current) {
            hasAnimated.current = true;
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [loading, zones.length]);

    const loadZones = async (showLoading: boolean = true) => {
        if (showLoading) setLoading(true);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setZones(data);
                    // Preserve selected zone if it still exists, otherwise select first
                    if (selectedZone) {
                        const updatedZone = data.find(z => z.id === selectedZone.id);
                        if (updatedZone) {
                            setSelectedZone(updatedZone);
                        } else if (data.length > 0) {
                            setSelectedZone(data[0]);
                        }
                    } else if (data.length > 0) {
                        setSelectedZone(data[0]);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading zones:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const saveConfiguration = async () => {
        if (!selectedZone) return;

        const currentZoneId = selectedZone.id;
        const currentConfig = selectedZone.config;

        try {
            // FIX: Asegurar que los booleanos sean booleanos, no strings
            const configToSend = {
                ...currentConfig,
                autoMode: Boolean(currentConfig.autoMode),
                useWeatherApi: Boolean(currentConfig.useWeatherApi),
                respectRainForecast: Boolean(currentConfig.respectRainForecast),
            };

            const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${currentZoneId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: configToSend })
            });

            if (response.ok) {
                // Reload zones to get the updated data from the server (without showing loading)
                await loadZones(false);
                Alert.alert('Éxito', 'Configuración guardada correctamente');
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar la configuración');
        }
    };

    const updateConfig = (key: string, value: any) => {
        if (!selectedZone) return;
        const updatedZone = {
            ...selectedZone,
            config: { ...selectedZone.config, [key]: value }
        };
        setSelectedZone(updatedZone);
    };

    const adjustThreshold = (delta: number) => {
        if (!selectedZone) return;
        const newValue = Math.max(0, Math.min(100, selectedZone.config.moistureThreshold + delta));
        updateConfig('moistureThreshold', newValue);
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (zones.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Header />
                <View style={styles.emptyContainer}>
                    <Ionicons name="settings-outline" size={64} color={colors.border} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No tienes zonas configuradas</Text>
                    <Link href="/add-zone" asChild>
                        <TouchableOpacity style={[styles.addZoneButton, { backgroundColor: colors.primary }]}>
                            <Ionicons name="add-circle" size={24} color="#fff" />
                            <Text style={[styles.addZoneButtonText, { color: '#fff' }]}>Agregar Zona</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        );
    }

    if (!selectedZone) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Header />
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.pageHeader}>
                        <Text style={[styles.title, { color: colors.text }]}>Configuración</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ajusta los parámetros de cada zona</Text>
                    </View>

                    {/* Zone Selector */}
                    <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="location" size={20} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Zona Activa</Text>
                        </View>
                        <View style={styles.zoneGrid}>
                            {zones.map(zone => (
                                <TouchableOpacity
                                    key={zone.id}
                                    style={[
                                        styles.zoneButton,
                                        {
                                            backgroundColor: selectedZone.id === zone.id ? colors.primary + '15' : colors.card,
                                            borderColor: selectedZone.id === zone.id ? colors.primary : colors.border
                                        },
                                        selectedZone.id === zone.id && styles.zoneButtonActive
                                    ]}
                                    onPress={() => setSelectedZone(zone)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.zoneButtonContent}>
                                        <Text style={[
                                            styles.zoneName,
                                            { color: selectedZone.id === zone.id ? colors.primary : colors.text },
                                            selectedZone.id === zone.id && styles.zoneNameActive
                                        ]}>
                                            {zone.name}
                                        </Text>
                                        <Badge type={zone.type} />
                                    </View>
                                    {selectedZone.id === zone.id && (
                                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Card>

                    {/* Moisture Threshold */}
                    <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="water" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.cardHeaderText}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Umbral de Humedad</Text>
                                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                    Nivel mínimo para activar riego
                                </Text>
                            </View>
                        </View>

                        <View style={styles.thresholdContainer}>
                            <View style={styles.thresholdDisplay}>
                                <Text style={[styles.thresholdValue, { color: colors.text }]}>{selectedZone.config.moistureThreshold}</Text>
                                <Text style={[styles.thresholdUnit, { color: colors.textSecondary }]}>%</Text>
                            </View>

                            <View 
                                style={[styles.thresholdBar, { backgroundColor: colors.border }]}
                                // @ts-ignore
                                nativeID="threshold-slider"
                            >
                                <View
                                    style={[
                                        styles.thresholdFill,
                                        { width: `${selectedZone.config.moistureThreshold}%`, backgroundColor: colors.primary }
                                    ]}
                                />
                            </View>

                            <View style={styles.thresholdButtons}>
                                <TouchableOpacity
                                    style={styles.thresholdButton}
                                    onPress={() => adjustThreshold(-10)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="remove-circle" size={36} color={colors.primary} />
                                    <Text style={[styles.thresholdButtonText, { color: colors.textSecondary }]}>-10</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.thresholdButton}
                                    onPress={() => adjustThreshold(-5)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="remove" size={28} color={colors.primary} />
                                    <Text style={[styles.thresholdButtonText, { color: colors.textSecondary }]}>-5</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.thresholdButton}
                                    onPress={() => adjustThreshold(5)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="add" size={28} color={colors.primary} />
                                    <Text style={[styles.thresholdButtonText, { color: colors.textSecondary }]}>+5</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.thresholdButton}
                                    onPress={() => adjustThreshold(10)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="add-circle" size={36} color={colors.primary} />
                                    <Text style={[styles.thresholdButtonText, { color: colors.textSecondary }]}>+10</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.thresholdLabels}>
                                <View style={styles.labelRow}>
                                    <Ionicons name="water-outline" size={16} color={colors.textSecondary} />
                                    <Text style={[styles.thresholdLabel, { color: colors.textSecondary }]}>Seco</Text>
                                </View>
                                <View style={styles.labelRow}>
                                    <Ionicons name="water" size={16} color={colors.primary} />
                                    <Text style={[styles.thresholdLabel, { color: colors.textSecondary }]}>Húmedo</Text>
                                </View>
                            </View>
                        </View>
                    </Card>

                    {/* Weather API */}
                    <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="cloud" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.cardHeaderText}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Integración Meteorológica</Text>
                                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                    {selectedZone.type === 'Indoor'
                                        ? 'Recomendado desactivar para interiores'
                                        : 'Previene riegos innecesarios'}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.settingRow, { borderTopColor: colors.border }]}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="cloud-outline" size={20} color={colors.text} />
                                <Text style={[styles.settingLabel, { color: colors.text }]}>Usar Predicción del Clima</Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.toggle,
                                    { backgroundColor: selectedZone.config.useWeatherApi ? colors.primary : colors.border },
                                    selectedZone.config.useWeatherApi && styles.toggleActive
                                ]}
                                onPress={() => updateConfig('useWeatherApi', !selectedZone.config.useWeatherApi)}
                                activeOpacity={0.8}
                                // @ts-ignore
                                nativeID="weather-api-toggle"
                            >
                                <View style={[
                                    styles.toggleThumb,
                                    selectedZone.config.useWeatherApi && styles.toggleThumbActive
                                ]} />
                            </TouchableOpacity>
                        </View>

                        <View style={[
                            styles.settingRow,
                            { borderTopColor: colors.border },
                            !selectedZone.config.useWeatherApi && styles.settingRowDisabled
                        ]}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="rainy-outline" size={20} color={colors.text} />
                                <Text style={[styles.settingLabel, { color: colors.text }]}>Respetar Pronóstico de Lluvia</Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.toggle,
                                    { backgroundColor: selectedZone.config.respectRainForecast ? colors.primary : colors.border },
                                    selectedZone.config.respectRainForecast && styles.toggleActive,
                                    !selectedZone.config.useWeatherApi && styles.toggleDisabled
                                ]}
                                onPress={() => updateConfig('respectRainForecast', !selectedZone.config.respectRainForecast)}
                                disabled={!selectedZone.config.useWeatherApi}
                                activeOpacity={0.8}
                            >
                                <View style={[
                                    styles.toggleThumb,
                                    selectedZone.config.respectRainForecast && styles.toggleThumbActive
                                ]} />
                            </TouchableOpacity>
                        </View>
                    </Card>

                    <Button
                        title="Guardar Configuración"
                        onPress={saveConfiguration}
                        style={styles.saveButton}
                    />

                    {/* Tutorial */}
                    <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="school" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.cardHeaderText}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Ayuda y Tutorial</Text>
                                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Aprende a usar AgroMind</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.tutorialButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
                            onPress={async () => {
                                try {
                                    await AsyncStorage.removeItem('tutorialCompleted');
                                    await AsyncStorage.removeItem('hasSeenWelcome');
                                    startTutorial();
                                    // Navegar al dashboard para empezar el tutorial
                                    setTimeout(() => {
                                        router.push('/(tabs)');
                                    }, 300);
                                } catch (error) {
                                    console.error('Error reiniciando tutorial:', error);
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.tutorialButtonContent}>
                                <Ionicons name="book-outline" size={20} color={colors.primary} />
                                <Text style={[styles.tutorialButtonText, { color: colors.text }]}>Ver Tutorial Nuevamente</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </Card>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
                <TutorialOverlay />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        marginTop: Spacing.lg,
    },
    addZoneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.xl,
        gap: Spacing.sm,
    },
    addZoneButtonText: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    pageHeader: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSizes['3xl'],
        fontWeight: '700',
    },
    subtitle: {
        fontSize: FontSizes.sm,
        marginTop: 4,
    },
    card: {
        marginBottom: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.base,
        fontWeight: '700',
    },
    cardHeader: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardHeaderText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
    },
    cardSubtitle: {
        fontSize: FontSizes.sm,
        marginTop: 4,
        lineHeight: 20,
    },
    zoneGrid: {
        gap: Spacing.sm,
    },
    zoneButton: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    zoneButtonActive: {
    },
    zoneButtonContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    zoneName: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    zoneNameActive: {
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
    },
    toggleContainerActive: {
    },
    toggleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    toggleLabel: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    toggleLabelActive: {
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
    },
    settingRowDisabled: {
        opacity: 0.5,
    },
    settingInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    settingLabel: {
        fontSize: FontSizes.base,
        fontWeight: '500',
        flex: 1,
    },
    toggle: {
        width: 52,
        height: 30,
        borderRadius: 15,
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
    },
    toggleDisabled: {
        opacity: 0.5,
    },
    toggleThumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    toggleThumbActive: {
        transform: [{ translateX: 22 }],
    },
    thresholdContainer: {
        marginTop: Spacing.md,
    },
    thresholdDisplay: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'baseline',
        marginBottom: Spacing.lg,
    },
    thresholdValue: {
        fontSize: 56,
        fontWeight: '700',
    },
    thresholdUnit: {
        fontSize: FontSizes['2xl'],
        fontWeight: '600',
        marginLeft: 4,
    },
    thresholdBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    thresholdFill: {
        height: '100%',
    },
    thresholdButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: Spacing.md,
    },
    thresholdButton: {
        alignItems: 'center',
        padding: Spacing.sm,
    },
    thresholdButtonText: {
        fontSize: FontSizes.xs,
        marginTop: 4,
        fontWeight: '700',
    },
    thresholdLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    thresholdLabel: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    saveButton: {
        marginBottom: Spacing.lg,
    },
    tutorialButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    tutorialButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    tutorialButtonText: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        color: Colors.emerald[700],
    },
    bottomSpacer: {
        height: Spacing.xl,
    },
});
