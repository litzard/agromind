import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
    Dimensions,
} from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTutorial } from '../../context/TutorialContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/Card';
import { Header } from '../../components/Header';
import { TutorialOverlay } from '../../components/TutorialOverlay';
import { WelcomeModal } from '../../components/WelcomeModal';
import { Zone, ZoneConfig, ZoneSensors, ZoneStatus } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../styles/theme';
import { API_CONFIG } from '../../constants/api';
import { getLocalWeather, getUserLocation } from '../../services/weatherService';
import esp32Service from '../../services/esp32Service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DEFAULT_SENSORS: ZoneSensors = {
    soilMoisture: null,
    temperature: null,
    humidity: null,
    lightLevel: null,
    tankLevel: null,
    waterLevel: null,
};

const DEFAULT_STATUS: ZoneStatus = {
    pump: 'OFF',
    lastWatered: null,
    connection: 'UNKNOWN',
    nextScheduledWatering: null,
    lastUpdate: null,
    hasSensorData: false,
};

const DEFAULT_CONFIG: ZoneConfig = {
    autoMode: false,
    moistureThreshold: 30,
    wateringDuration: 10,
    useWeatherApi: false,
    respectRainForecast: false,
};

const mergeZoneSensors = (current: ZoneSensors | null, incoming?: ZoneSensors | null): ZoneSensors => {
    const merged: ZoneSensors = {
        ...DEFAULT_SENSORS,
        ...(current || {}),
        ...(incoming || {}),
    };

    const tankIsNumber = typeof merged.tankLevel === 'number';
    const waterIsNumber = typeof merged.waterLevel === 'number';

    if (!tankIsNumber && waterIsNumber) {
        merged.tankLevel = merged.waterLevel;
    } else if (!waterIsNumber && tankIsNumber) {
        merged.waterLevel = merged.tankLevel;
    }

    return merged;
};

const mergeZoneStatus = (current?: ZoneStatus | null, incoming?: ZoneStatus | null): ZoneStatus => ({
    ...DEFAULT_STATUS,
    ...(current || {}),
    ...(incoming || {}),
});

const mergeZoneConfig = (current?: ZoneConfig | null, incoming?: ZoneConfig | null): ZoneConfig => ({
    ...DEFAULT_CONFIG,
    ...(current || {}),
    ...(incoming || {}),
});

export default function DashboardScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const params = useLocalSearchParams();
    const initialZoneId = params.zoneId ? (Array.isArray(params.zoneId) ? params.zoneId[0] : params.zoneId) : null;
    const { startTutorial, hasCompletedTutorial, isActive: tutorialActive, currentStep, steps, setCurrentScreen } = useTutorial();
    const [zones, setZones] = useState<Zone[]>([]);
    const [activeZoneId, setActiveZoneId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [showZoneSelector, setShowZoneSelector] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [weather, setWeather] = useState<any>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [manualWatering, setManualWatering] = useState(false);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const weatherIconScale = React.useRef(new Animated.Value(1)).current;
    const sensorAnims = React.useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;
    const hasAnimated = React.useRef(false);

    const activeZone = zones.find(z => z.id.toString() === activeZoneId);
    const activeZoneConnection = activeZone ? (activeZone.status.connection || 'UNKNOWN').toUpperCase() : 'UNKNOWN';
    const isActiveZoneOnline = activeZoneConnection === 'ONLINE';
    const activeZoneSensors = (activeZone?.sensors ?? {}) as ZoneSensors;
    const hasSensorData = Boolean(activeZone?.status?.hasSensorData || activeZone?.status?.lastUpdate);
    const soilMoistureValue = typeof activeZoneSensors.soilMoisture === 'number' ? activeZoneSensors.soilMoisture : null;
    const temperatureValue = typeof activeZoneSensors.temperature === 'number' ? activeZoneSensors.temperature : null;
    const tankLevelValue = typeof activeZoneSensors.tankLevel === 'number'
        ? activeZoneSensors.tankLevel
        : typeof activeZoneSensors.waterLevel === 'number'
            ? activeZoneSensors.waterLevel
            : null;
    const lightLevelValue = typeof activeZoneSensors.lightLevel === 'number' ? activeZoneSensors.lightLevel : null;

    useFocusEffect(
        React.useCallback(() => {
            loadZones();
            setCurrentScreen('dashboard');
        }, [])
    );

    // Mostrar modal de bienvenida para usuarios nuevos
    useEffect(() => {
        const checkFirstVisit = async () => {
            if (!loading && !hasCompletedTutorial) {
                const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
                if (!hasSeenWelcome) {
                    setTimeout(() => {
                        setShowWelcomeModal(true);
                    }, 500);
                }
            }
        };
        checkFirstVisit();
    }, [loading, hasCompletedTutorial]);

    const handleStartTutorial = async () => {
        await AsyncStorage.setItem('hasSeenWelcome', 'true');
        setShowWelcomeModal(false);
        startTutorial();
    };

    const handleSkipWelcome = async () => {
        await AsyncStorage.setItem('hasSeenWelcome', 'true');
        setShowWelcomeModal(false);
    };

    useEffect(() => {
        if (zones.length > 0 && !activeZoneId) {
            // Si viene de crear una zona, seleccionarla automáticamente
            if (initialZoneId && zones.find(z => z.id.toString() === initialZoneId)) {
                setActiveZoneId(initialZoneId);
            } else {
                setActiveZoneId(zones[0].id.toString());
            }
        }
    }, [zones, activeZoneId, initialZoneId]);

    useEffect(() => {
        if (!loading && zones.length > 0 && !hasAnimated.current) {
            hasAnimated.current = true;

            // Animación principal de fade-in
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();

            // Animaciones escalonadas para sensores
            Animated.stagger(150, sensorAnims.map(anim =>
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                })
            )).start();
        }
    }, [loading, zones.length]);

    // Animación de bounce para ícono del clima
    useEffect(() => {
        if (weather) {
            Animated.sequence([
                Animated.timing(weatherIconScale, {
                    toValue: 1.2,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(weatherIconScale, {
                    toValue: 1,
                    friction: 3,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [weather]);

    // Iniciar polling de datos ESP32 cuando cambia la zona activa
    useEffect(() => {
        if (!activeZone) return;

        console.log(`📡 Iniciando polling para zona ${activeZone.id}`);

        esp32Service.startPolling(activeZone.id, (zoneSnapshot) => {
            setZones(prev => prev.map(z =>
                z.id === zoneSnapshot.id
                    ? {
                        ...z,
                        ...(zoneSnapshot as Partial<Zone>),
                        sensors: mergeZoneSensors(z.sensors, zoneSnapshot.sensors || null),
                        status: mergeZoneStatus(z.status, zoneSnapshot.status || null),
                        config: mergeZoneConfig(z.config, zoneSnapshot.config || null),
                    }
                    : z
            ));
        }, 5000); // Polling cada 5 segundos

        return () => {
            console.log(`🛑 Deteniendo polling para zona ${activeZone.id}`);
            esp32Service.stopPolling(activeZone.id);
        };
    }, [activeZone?.id]);

    // Cargar clima cuando cambia la zona activa
    useEffect(() => {
        const loadWeather = async () => {
            if (!activeZone || !activeZone.config.useWeatherApi) {
                setWeather(null);
                return;
            }

            setWeatherLoading(true);
            try {
                try {
                    const location = await getUserLocation();
                    const weatherData = await getLocalWeather(location.lat, location.lon);
                    setWeather(weatherData);
                } catch (locError: any) {
                    console.warn('No se pudo obtener ubicación/clima:', locError.message);
                    setWeather(null);
                }
            } catch (error) {
                console.error('Error loading weather:', error);
                setWeather(null);
            } finally {
                setWeatherLoading(false);
            }
        };

        loadWeather();
        // Recargar clima cada 10 minutos
        const interval = setInterval(loadWeather, 600000);
        return () => clearInterval(interval);
    }, [activeZone?.id, activeZone?.config.useWeatherApi]);

    const loadZones = async () => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                setZones(data);
            }
        } catch (error) {
            console.error('Error loading zones:', error);
        } finally {
            setLoading(false);
        }
    };

    // Polling automático cada 3 segundos para datos en tiempo real
    useEffect(() => {
        if (!user?.id) return;

        const pollInterval = setInterval(() => {
            loadZones();
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [user?.id]);

    const toggleAutoMode = async () => {
        if (!activeZone) return;

        const currentZoneId = activeZone.id;
        const currentZone = activeZone;

        try {
            const newAutoMode = !currentZone.config.autoMode;
            const configToSend = {
                ...currentZone.config,
                autoMode: Boolean(newAutoMode),
                useWeatherApi: Boolean(currentZone.config.useWeatherApi),
                respectRainForecast: Boolean(currentZone.config.respectRainForecast),
            };

            const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${currentZoneId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: configToSend })
            });

            if (response.ok) {
                setZones(prev => prev.map(z =>
                    z.id === currentZoneId
                        ? { ...z, config: { ...z.config, autoMode: newAutoMode } }
                        : z
                ));
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo cambiar el modo automático');
        }
    };

    const handleManualWater = async () => {
        if (!activeZone || manualWatering) return;

        const currentZoneId = activeZone.id;
        if (!hasSensorData) {
            Alert.alert('Esperando datos', 'Aún no recibimos lecturas del ESP32 de esta zona. Conéctalo y envía datos antes de activar el riego.');
            return;
        }

        // Verificar que el tanque tenga agua
        const availableTankLevel = typeof tankLevelValue === 'number' ? tankLevelValue : 0;
        if (availableTankLevel <= 5) {
            Alert.alert('Tanque Vacío', 'No hay suficiente agua en el tanque para regar.');
            return;
        }

        // Verificar que la bomba no esté ya funcionando
        if (activeZone.status.pump === 'ON') {
            return;
        }

        try {
            // Animación de botón al presionar
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            setManualWatering(true);

            // Actualizar estado local inmediatamente para feedback visual
            setZones(prev => prev.map(z =>
                z.id === currentZoneId
                    ? { ...z, status: { ...z.status, pump: 'ON' as const } }
                    : z
            ));

            const turnedOn = await esp32Service.togglePump(currentZoneId, true);
            if (!turnedOn) {
                // Revertir estado si falló
                setZones(prev => prev.map(z =>
                    z.id === currentZoneId
                        ? { ...z, status: { ...z.status, pump: 'OFF' as const } }
                        : z
                ));
                throw new Error('No se pudo activar la bomba');
            }

            // Duración del riego manual (usar configuración de la zona o 10 segundos por defecto)
            const wateringDuration = (activeZone.config.wateringDuration || 10) * 1000;

            setTimeout(async () => {
                try {
                    await esp32Service.togglePump(currentZoneId, false);
                    // Actualizar estado local inmediatamente
                    setZones(prev => prev.map(z =>
                        z.id === currentZoneId
                            ? { ...z, status: { ...z.status, pump: 'OFF' as const } }
                            : z
                    ));
                } finally {
                    setManualWatering(false);
                }
            }, wateringDuration);
        } catch (error) {
            Alert.alert('Error', 'No se pudo iniciar el riego manual');
            setManualWatering(false);
        }
    };

    const CircularProgress = ({ value, threshold, hasData }: { value: number | null, threshold: number, hasData: boolean }) => {
        const size = 160;
        const strokeWidth = 10;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const numericValue = typeof value === 'number' ? value : 0;
        const progress = (numericValue / 100) * circumference;
        const offset = circumference - progress;

        const isLow = hasData && numericValue < threshold;
        const gradientId = !hasData ? 'gradientGray' : isLow ? 'gradientRed' : 'gradientGreen';

        return (
            <View style={styles.progressContainer}>
                <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Defs>
                        <LinearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#6EE7B7" stopOpacity="1" />
                        </LinearGradient>
                        <LinearGradient id="gradientRed" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#FCA5A5" stopOpacity="1" />
                        </LinearGradient>
                        <LinearGradient id="gradientGray" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#CBD5F5" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#E2E8F0" stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    {/* Background circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={Colors.gray[100]}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {/* Progress circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </Svg>
                <View style={styles.progressContent}>
                    <Text style={[styles.progressValue, { color: colors.text }]}>
                        {hasData ? Math.round(numericValue) : '--'}
                        {hasData && <Text style={[styles.progressUnit, { color: colors.textSecondary }]}>%</Text>}
                    </Text>
                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                        {hasData ? 'ACTUAL' : 'SIN DATOS'}
                    </Text>
                        <Text style={[
                            styles.statusText,
                            { color: !hasData ? Colors.gray[500] : isLow ? Colors.red[500] : Colors.emerald[500] }
                        ]}>
                            {hasData ? (isLow ? 'CRÍTICO' : 'ÓPTIMO') : 'Esperando...'}
                        </Text>
                    
                </View>
            </View>
        );
    };

    const handleDeleteZone = (zoneId: number) => {
        const zone = zones.find(z => z.id === zoneId);
        const zoneName = zone?.name || 'esta zona';

        Alert.alert(
            'Eliminar Zona',
            `¿Deseas eliminar ${zoneName}? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${zoneId}`, {
                                method: 'DELETE'
                            });

                            if (!response.ok) {
                                throw new Error('No se pudo eliminar la zona');
                            }

                            setZones(prev => {
                                const updated = prev.filter(z => z.id !== zoneId);

                                if (!updated.length) {
                                    setActiveZoneId('');
                                    setShowZoneSelector(false);
                                } else if (activeZoneId === zoneId.toString()) {
                                    setActiveZoneId(updated[0].id.toString());
                                }

                                return updated;
                            });

                            Alert.alert('Zona eliminada', `${zoneName} fue eliminada correctamente.`);
                        } catch (error) {
                            console.error('Error deleting zone:', error);
                            Alert.alert('Error', 'No se pudo eliminar la zona. Intenta nuevamente.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.emerald[600]} />
            </View>
        );
    }

    if (zones.length === 0) {
        return (
            <View style={styles.container}>
                <Header />
                <View style={styles.emptyContainer}>
                    <Ionicons name="leaf-outline" size={80} color={Colors.emerald[300]} style={{ marginBottom: Spacing.lg }} />
                    <Text style={styles.emptyText}>No tienes zonas configuradas</Text>
                    <Text style={styles.emptySubtext}>Crea tu primera zona para comenzar</Text>
                    <Link href="/add-zone" asChild>
                        <TouchableOpacity
                            style={styles.addZoneButton}
                            // @ts-ignore
                            nativeID="add-zone-button"
                        >
                            <Ionicons name="add-circle" size={24} color="#fff" />
                            <Text style={styles.addZoneButtonText}>Agregar Zona</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
                <WelcomeModal
                    visible={showWelcomeModal}
                    userName={user?.name || ''}
                    onStartTutorial={handleStartTutorial}
                    onSkip={handleSkipWelcome}
                />
                <TutorialOverlay />
            </View>
        );
    }

    if (!activeZone) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.emerald[600]} />
            </View>
        );
    }

    const isAutoModeEnabled = Boolean(activeZone.config.autoMode);
    const pumpState = activeZone.status.pump;
    const pumpLocked = pumpState === 'LOCKED';
    const pumpRunning = pumpState === 'ON' || manualWatering;
    
    // Detectar si el modo auto debería estar regando (humedad < umbral)
    const autoModeNeedsWatering = isAutoModeEnabled && 
        hasSensorData && 
        soilMoistureValue !== null && 
        soilMoistureValue < activeZone.config.moistureThreshold;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Header />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <TutorialOverlay />
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Zone Info Header */}
                    <View style={styles.zoneHeader}>
                        <View style={styles.zoneTitleRow}>
                            <Text style={[styles.zoneName, { color: colors.text }]}>{activeZone.name}</Text>
                            <TouchableOpacity
                                style={styles.zoneSelectorButton}
                                onPress={() => setShowZoneSelector(true)}
                            >
                                <Ionicons name="chevron-down" size={20} color={Colors.gray[400]} />
                            </TouchableOpacity>
                        </View>

                            <View style={styles.zoneStatusRow}>
                                <View style={[styles.typeTag, { backgroundColor: Colors.emerald[50] }]}>
                                <Ionicons name={activeZone.type === 'Indoor' ? 'home' : 'leaf'} size={14} color={Colors.emerald[600]} />
                                <Text style={styles.typeText}>{activeZone.type === 'Indoor' ? 'Interior' : 'Exterior'}</Text>
                            </View>
                                <View style={styles.connectionStatus}>
                                    <View style={[styles.statusDot, { backgroundColor: isActiveZoneOnline ? Colors.emerald[500] : Colors.gray[300] }]} />
                                    <Text style={[styles.connectionText, { color: isActiveZoneOnline ? colors.text : colors.textSecondary }]}>
                                        ESP32 {isActiveZoneOnline ? 'ONLINE' : 'OFFLINE'}
                                    </Text>
                                </View>
                        </View>
                    </View>

                    {/* Main Card */}
                    <Card style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {/* Auto Mode Toggle - Top Right */}
                        <View style={styles.autoModeTopRight}>
                            <Text style={styles.autoModeLabel}>Modo Auto</Text>
                            <TouchableOpacity
                                style={[styles.switch, activeZone.config.autoMode && styles.switchActive]}
                                onPress={toggleAutoMode}
                                // @ts-ignore
                                nativeID="auto-mode-switch"
                            >
                                <View style={[styles.switchThumb, activeZone.config.autoMode && styles.switchThumbActive]}>
                                    <Ionicons name="flash" size={12} color={activeZone.config.autoMode ? Colors.emerald[600] : Colors.gray[400]} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Moisture Circle - Centered */}
                        <View style={styles.moistureSection}>
                            <View
                                // @ts-ignore
                                nativeID="moisture-circle"
                            >
                                <CircularProgress
                                    value={soilMoistureValue}
                                    threshold={activeZone.config.moistureThreshold}
                                    hasData={hasSensorData}
                                />
                            </View>
                        </View>

                        {/* Secondary sensors - minimal style */}
                        <View style={styles.sensorsRowMinimal}>
                            {/* Temperature */}
                            <Animated.View
                                style={[
                                    styles.sensorMinimal,
                                    {
                                        opacity: sensorAnims[0],
                                        transform: [{
                                            translateY: sensorAnims[0].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [20, 0]
                                            })
                                        }]
                                    }
                                ]}
                            >
                                <Text style={[styles.sensorMinimalLabel, { color: colors.textSecondary }]}>TEMPERATURA</Text>
                                <Text style={[styles.sensorMinimalValue, { color: colors.text }]}>
                                    {hasSensorData && temperatureValue !== null ? `${Math.round(temperatureValue)}°` : '--'}
                                </Text>
                                <Ionicons name="thermometer" size={24} color={hasSensorData ? Colors.orange[500] : Colors.gray[300]} />
                            </Animated.View>

                            {/* Tank Level */}
                            <Animated.View
                                style={[
                                    styles.sensorMinimal,
                                    {
                                        opacity: sensorAnims[1],
                                        transform: [{
                                            translateY: sensorAnims[1].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [20, 0]
                                            })
                                        }]
                                    }
                                ]}
                            >
                                <Text style={[styles.sensorMinimalLabel, { color: colors.textSecondary }]}>TANQUE</Text>
                                <Text style={[styles.sensorMinimalValue, { color: colors.text }]}>
                                    {hasSensorData && tankLevelValue !== null ? `${tankLevelValue.toFixed(0)}%` : '--'}
                                </Text>
                                <Ionicons
                                    name="water"
                                    size={24}
                                    color={
                                        hasSensorData && tankLevelValue !== null
                                            ? (tankLevelValue < 20 ? Colors.red[500] : Colors.blue[500])
                                            : Colors.gray[300]
                                    }
                                />
                            </Animated.View>

                            {/* Light Level */}
                            <Animated.View
                                style={[
                                    styles.sensorMinimal,
                                    {
                                        opacity: sensorAnims[2],
                                        transform: [{
                                            translateY: sensorAnims[2].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [20, 0]
                                            })
                                        }]
                                    }
                                ]}
                            >
                                <Text style={[styles.sensorMinimalLabel, { color: colors.textSecondary }]}>LUZ</Text>
                                <Text style={[styles.sensorMinimalValue, { color: colors.text }]}>
                                    {hasSensorData && lightLevelValue !== null ? `${Math.round(lightLevelValue)}%` : '--'}
                                </Text>
                                <Ionicons name="sunny" size={24} color={hasSensorData ? Colors.yellow[500] : Colors.gray[300]} />
                            </Animated.View>
                        </View>

                        {/* Pump status - minimal */}
                        <View style={styles.pumpStatusMinimal}>
                            <View style={[styles.pumpDot, {
                                backgroundColor: !hasSensorData
                                    ? Colors.gray[300]
                                    : (activeZone.status.pump === 'ON' || manualWatering)
                                        ? Colors.emerald[500]
                                        : activeZone.status.pump === 'LOCKED'
                                            ? Colors.red[500]
                                            : Colors.gray[300]
                            }]} />
                            <Text style={[styles.pumpTextMinimal, { 
                                color: (activeZone.status.pump === 'ON' || manualWatering) 
                                    ? Colors.emerald[600] 
                                    : colors.textSecondary,
                                fontWeight: (activeZone.status.pump === 'ON' || manualWatering) ? '700' : '600'
                            }]}>
                                {!hasSensorData
                                    ? 'Esperando datos del ESP32'
                                    : (activeZone.status.pump === 'ON' || manualWatering)
                                        ? 'Bomba Activa'
                                        : activeZone.status.pump === 'LOCKED'
                                            ? '🔒 Bomba bloqueada (tanque bajo)'
                                            : 'Bomba inactiva'}
                            </Text>
                        </View>

                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <TouchableOpacity
                                onPress={handleManualWater}
                                disabled={pumpRunning || pumpLocked || manualWatering}
                                activeOpacity={pumpRunning || pumpLocked || manualWatering ? 1 : 0.7}
                                // @ts-ignore
                                nativeID="manual-water-button"
                            >
                                <ExpoLinearGradient
                                    colors={
                                        pumpLocked
                                            ? ['#64748B', '#475569']
                                            : pumpRunning || manualWatering
                                                ? ['#10B981', '#059669']
                                                : ['#1E293B', '#0F172A']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        styles.manualWaterButton,
                                        activeZone.status.pump === 'ON' && styles.manualWaterButtonActive
                                    ]}
                                >
                                    {pumpLocked ? (
                                        <>
                                            <Ionicons name="lock-closed" size={20} color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={styles.manualWaterText}>Tanque bajo</Text>
                                        </>
                                    ) : pumpRunning || manualWatering ? (
                                        <>
                                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={styles.manualWaterText}>Regando...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="flash" size={20} color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={styles.manualWaterText}>Iniciar Riego Manual</Text>
                                        </>
                                    )}
                                </ExpoLinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </Card>

                    {/* Weather Widget */}
                    {activeZone.config.useWeatherApi && (
                        <ExpoLinearGradient
                            colors={['#38BDF8', '#2563EB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.weatherCard}
                        >
                            {weatherLoading ? (
                                <View style={styles.weatherLoading}>
                                    <ActivityIndicator size="large" color="#fff" />
                                    <Text style={styles.weatherLoadingText}>Cargando clima...</Text>
                                </View>
                            ) : weather ? (
                                <>
                                    <View style={styles.weatherHeader}>
                                        <View>
                                            <Text style={styles.weatherCity}>{weather.cityName || 'Local'}</Text>
                                            <Text style={styles.weatherTemp}>{weather.temp}°</Text>
                                            <Text style={styles.weatherDescription}>{weather.description}</Text>
                                        </View>
                                        <Animated.View style={[
                                            styles.weatherIconContainer,
                                            { transform: [{ scale: weatherIconScale }] }
                                        ]}>
                                            <Ionicons
                                                name={weather.condition === 'Rain' ? 'rainy' : 'sunny'}
                                                size={48}
                                                color="#fff"
                                            />
                                        </Animated.View>
                                    </View>
                                    <View style={styles.weatherFooter}>
                                        <Text style={styles.weatherRainLabel}>Probabilidad Lluvia</Text>
                                        <Text style={styles.weatherRainValue}>{weather.rainProbability}%</Text>
                                    </View>
                                    <View style={styles.weatherProgressBar}>
                                        <View style={[styles.weatherProgressFill, { width: `${weather.rainProbability}%` }]} />
                                    </View>
                                </>
                            ) : (
                                <View style={styles.weatherError}>
                                    <Ionicons name="cloud-offline" size={48} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.weatherErrorText}>No se pudo cargar el clima</Text>
                                </View>
                            )}
                        </ExpoLinearGradient>
                    )}

                </Animated.View>
            </ScrollView>

            {/* Zone Selector Modal */}
            <Modal
                visible={showZoneSelector}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowZoneSelector(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowZoneSelector(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Zona</Text>
                        {zones.map(zone => (
                            <View key={zone.id} style={styles.modalItemWrapper}>
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        activeZoneId === zone.id.toString() && styles.modalItemActive
                                    ]}
                                    onPress={() => {
                                        setActiveZoneId(zone.id.toString());
                                        setShowZoneSelector(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        activeZoneId === zone.id.toString() && styles.modalItemTextActive
                                    ]}>{zone.name}</Text>
                                    {activeZoneId === zone.id.toString() && (
                                        <Ionicons name="checkmark" size={20} color={Colors.emerald[600]} />
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalDeleteButton}
                                    onPress={() => handleDeleteZone(zone.id)}
                                >
                                    <Ionicons name="close" size={16} color={Colors.gray[500]} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <Link href="/add-zone" asChild>
                            <TouchableOpacity style={styles.modalAddItem}>
                                <Ionicons name="add" size={20} color={Colors.emerald[600]} />
                                <Text style={styles.modalAddItemText}>Agregar nueva zona</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </TouchableOpacity>
            </Modal>

            <WelcomeModal
                visible={showWelcomeModal}
                userName={user?.name || ''}
                onStartTutorial={handleStartTutorial}
                onSkip={handleSkipWelcome}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.gray[50],
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
    },
    emptyText: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.gray[700],
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: FontSizes.base,
        color: Colors.gray[500],
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    addZoneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.emerald[600],
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        gap: Spacing.sm,
    },
    addZoneButtonText: {
        color: '#fff',
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    zoneHeader: {
        marginBottom: Spacing.lg,
    },
    zoneTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    zoneName: {
        fontSize: 30,
        fontWeight: '800',
        color: Colors.gray[900],
        letterSpacing: -0.8,
    },
    zoneSelectorButton: {
        padding: Spacing.xs,
    },
    zoneStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    typeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        shadowColor: Colors.emerald[500],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    typeText: {
        fontSize: FontSizes.xs,
        fontWeight: '700',
        color: Colors.emerald[700],
        letterSpacing: 0.3,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    connectionText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        color: Colors.gray[400],
    },
    mainCard: {
        marginBottom: Spacing.lg,
        padding: Spacing.xl,
        position: 'relative',
        shadowColor: Colors.emerald[600],
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: BorderRadius.xxl + 8,
    },
    autoModeTopRight: {
        position: 'absolute',
        top: Spacing.lg,
        right: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        zIndex: 10,
    },
    moistureSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
        marginTop: Spacing.lg,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
    },
    sensorsRowMinimal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    sensorMinimal: {
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    sensorMinimalLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.gray[400],
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    sensorMinimalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.gray[900],
        marginVertical: 6,
        letterSpacing: -0.5,
    },
    pumpStatusMinimal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
    },
    pumpDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    pumpTextMinimal: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.gray[600],
    },

    autoModeLabel: {
        fontSize: FontSizes.xs,
        fontWeight: '700',
        color: Colors.gray[400],
    },
    switch: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.gray[200],
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    switchActive: {
        backgroundColor: Colors.emerald[500],
        shadowColor: Colors.emerald[600],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    switchThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    switchThumbActive: {
        transform: [{ translateX: 20 }],
    },

    progressContainer: {
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    progressContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressValue: {
        fontSize: 48,
        fontWeight: '800',
        color: Colors.gray[900],
        letterSpacing: -1,
    },
    progressUnit: {
        fontSize: 22,
        color: Colors.gray[400],
        fontWeight: '600',
    },
    progressLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.gray[400],
        marginTop: 6,
        marginBottom: Spacing.sm,
        letterSpacing: 1,
    },
    statusBadge: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 2,
    },
    statusText: {
        fontSize: FontSizes.xs,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    manualWaterButton: {
        borderRadius: BorderRadius.xl + 4,
        padding: Spacing.lg + 2,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    manualWaterButtonActive: {
        shadowColor: Colors.emerald[600],
        shadowOpacity: 0.5,
    },
    manualWaterText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: FontSizes.base,
        letterSpacing: 0.3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    modalTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.gray[900],
        marginBottom: Spacing.md,
    },
    modalItemWrapper: {
        position: 'relative',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    modalItemActive: {
        backgroundColor: Colors.emerald[50],
        marginHorizontal: -Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    modalItemText: {
        fontSize: FontSizes.base,
        color: Colors.gray[700],
    },
    modalItemTextActive: {
        color: Colors.emerald[700],
        fontWeight: '600',
    },
    modalDeleteButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalAddItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        marginTop: Spacing.sm,
    },
    modalAddItemText: {
        color: Colors.emerald[600],
        fontWeight: '600',
        fontSize: FontSizes.base,
    },
    // Weather Widget Styles
    weatherCard: {
        marginTop: Spacing.md,
        padding: Spacing.xl,
        borderRadius: BorderRadius.xxl,
        overflow: 'hidden',
        shadowColor: Colors.blue[600],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    weatherLoading: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
    },
    weatherLoadingText: {
        color: '#fff',
        marginTop: Spacing.sm,
        fontSize: FontSizes.sm,
    },
    weatherHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    weatherCity: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: FontSizes.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    weatherTemp: {
        color: '#fff',
        fontSize: 56,
        fontWeight: '800',
        marginTop: 4,
        letterSpacing: -2,
    },
    weatherDescription: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: FontSizes.sm,
        fontWeight: '500',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    weatherIconContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
    },
    weatherFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    weatherRainLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: FontSizes.xs,
        fontWeight: '500',
    },
    weatherRainValue: {
        color: '#fff',
        fontSize: FontSizes.sm,
        fontWeight: '700',
    },
    weatherProgressBar: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    weatherProgressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    weatherError: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
    },
    weatherErrorText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: FontSizes.sm,
        marginTop: Spacing.sm,
    },
});
