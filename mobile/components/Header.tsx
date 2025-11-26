import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Platform, 
    Animated,
    ScrollView,
    Alert,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import { useRouter } from 'expo-router';
import { API_CONFIG } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Notification {
    id: string;
    type: 'warning' | 'error' | 'success' | 'info';
    title: string;
    message: string;
    time: string;
    timestamp: number;
    read: boolean;
    zoneId?: number;
}

export const Header = () => {
    const { user, logout } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [prevZonesState, setPrevZonesState] = useState<any>(null);
    
    // Animaciones
    const notificationAnim = useRef(new Animated.Value(0)).current;
    const profileAnim = useRef(new Animated.Value(0)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    // Animación de notificaciones
    useEffect(() => {
        if (showNotifications) {
            Animated.parallel([
                Animated.spring(notificationAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 65,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(notificationAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [showNotifications]);

    // Animación de perfil
    useEffect(() => {
        if (showProfileMenu) {
            Animated.spring(profileAnim, {
                toValue: 1,
                friction: 8,
                tension: 65,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(profileAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [showProfileMenu]);

    // Cargar notificaciones guardadas al inicio
    useEffect(() => {
        if (user?.id) {
            loadNotifications();
        }
    }, [user?.id]);

    // Verificar zonas cada 5 segundos para generar notificaciones
    useEffect(() => {
        if (!user?.id) return;

        const checkZones = async () => {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${user.id}`);
                if (!response.ok) return;

                const zones = await response.json();
                generateNotifications(zones);
                setPrevZonesState(zones);
            } catch (error) {
                console.error('Error checking zones:', error);
            }
        };

        checkZones();
        const interval = setInterval(checkZones, 5000);

        return () => clearInterval(interval);
    }, [user?.id, prevZonesState]);

    // Key de almacenamiento único por usuario
    const getNotificationsKey = () => `notifications_${user?.id || 'guest'}`;

    const loadNotifications = async () => {
        try {
            const stored = await AsyncStorage.getItem(getNotificationsKey());
            if (stored) {
                const parsed = JSON.parse(stored);
                // Mantener solo las últimas 24 horas
                const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
                const recent = parsed.filter((n: Notification) => n.timestamp > dayAgo);
                setNotifications(recent);
            } else {
                setNotifications([]);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const saveNotifications = async (notifs: Notification[]) => {
        try {
            await AsyncStorage.setItem(getNotificationsKey(), JSON.stringify(notifs));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    };

    const addNotification = (
        type: Notification['type'],
        title: string,
        message: string,
        zoneId?: number
    ) => {
        const newNotif: Notification = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            title,
            message,
            time: 'Ahora',
            timestamp: Date.now(),
            read: false,
            zoneId,
        };

        setNotifications(prev => {
            // Evitar duplicados recientes (mismo mensaje en los últimos 30 seg)
            const isDuplicate = prev.some(
                n => n.message === message && (Date.now() - n.timestamp) < 30000
            );
            if (isDuplicate) return prev;

            const updated = [newNotif, ...prev].slice(0, 50); // Máximo 50
            saveNotifications(updated);
            return updated;
        });
    };

    const generateNotifications = (zones: any[]) => {
        zones.forEach((zone: any) => {
            const prevZone = prevZonesState?.find((z: any) => z.id === zone.id);
            const sensors = zone.sensors || {};
            const prevSensors = prevZone?.sensors || {};

            const tankLevel = typeof sensors.tankLevel === 'number' ? sensors.tankLevel : null;
            const prevTankLevel = typeof prevSensors.tankLevel === 'number' ? prevSensors.tankLevel : null;
            const soilMoisture = typeof sensors.soilMoisture === 'number' ? sensors.soilMoisture : null;
            const prevSoilMoisture = typeof prevSensors.soilMoisture === 'number' ? prevSensors.soilMoisture : null;

            // Tanque bajo (< 20%)
            if (tankLevel !== null && tankLevel < 20 && tankLevel > 5) {
                if (prevTankLevel === null || prevTankLevel >= 20) {
                    addNotification(
                        'warning',
                        'Tanque Bajo',
                        `El tanque de ${zone.name} está al ${Math.round(tankLevel)}%`,
                        zone.id
                    );
                }
            }

            // Tanque crítico (< 5%)
            if (tankLevel !== null && tankLevel <= 5) {
                if (prevTankLevel === null || prevTankLevel > 5) {
                    addNotification(
                        'error',
                        'Tanque Vacío',
                        `¡Tanque de ${zone.name} vacío! Bomba bloqueada`,
                        zone.id
                    );
                }
            }

            // Bomba encendida
            if (zone.status.pump === 'ON' && prevZone?.status.pump !== 'ON') {
                addNotification(
                    'info',
                    'Riego Iniciado',
                    `${zone.name}: ${zone.config.autoMode ? 'Riego automático' : 'Riego manual'} activado`,
                    zone.id
                );
            }

            // Bomba apagada (completado)
            if (zone.status.pump === 'OFF' && prevZone?.status.pump === 'ON') {
                addNotification(
                    'success',
                    'Riego Completado',
                    `El riego en ${zone.name} ha finalizado`,
                    zone.id
                );
            }

            // Bomba bloqueada
            if (zone.status.pump === 'LOCKED' && prevZone?.status.pump !== 'LOCKED') {
                addNotification(
                    'error',
                    'Bomba Bloqueada',
                    `${zone.name}: Bomba bloqueada por falta de agua`,
                    zone.id
                );
            }

            // Modo automático activado
            if (zone.config.autoMode && prevZone && !prevZone.config.autoMode) {
                addNotification(
                    'info',
                    'Modo Automático',
                    `${zone.name}: Riego automático activado`,
                    zone.id
                );
            }

            // Humedad muy baja
            if (soilMoisture !== null && soilMoisture < 20) {
                if (prevSoilMoisture === null || prevSoilMoisture >= 20) {
                    addNotification(
                        'warning',
                        'Humedad Baja',
                        `${zone.name}: Humedad del suelo al ${Math.round(soilMoisture)}%`,
                        zone.id
                    );
                }
            }

            const connectionState = (zone.status.connection || '').toUpperCase();
            const prevConnectionState = (prevZone?.status.connection || '').toUpperCase();

            // Conexión perdida
            if (connectionState === 'OFFLINE' && prevConnectionState === 'ONLINE') {
                addNotification(
                    'error',
                    'Conexión Perdida',
                    `${zone.name}: Sin conexión con el sistema`,
                    zone.id
                );
            }
        });
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            saveNotifications(updated);
            return updated;
        });
    };

    const markAllAsRead = () => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            saveNotifications(updated);
            return updated;
        });
    };

    const clearNotifications = () => {
        Alert.alert(
            'Limpiar Notificaciones',
            '¿Deseas eliminar todas las notificaciones?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Limpiar',
                    style: 'destructive',
                    onPress: async () => {
                        setNotifications([]);
                        await AsyncStorage.removeItem(getNotificationsKey());
                    },
                },
            ]
        );
    };

    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Ahora';
        if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
        if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
        return `Hace ${Math.floor(seconds / 86400)} días`;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
                        setShowProfileMenu(false);
                        await logout();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const closeAll = () => {
        setShowNotifications(false);
        setShowProfileMenu(false);
    };

    const getNotificationGradient = (type: Notification['type']): [string, string] => {
        switch (type) {
            case 'error': return [Colors.red[500], Colors.red[600]];
            case 'warning': return [Colors.orange[400], Colors.orange[500]];
            case 'success': return [Colors.emerald[500], Colors.emerald[600]];
            default: return [Colors.blue[400], Colors.blue[500]];
        }
    };

    return (
        <>
            <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={styles.leftSection}>
                    <LinearGradient
                        colors={[Colors.emerald[500], Colors.emerald[600]]}
                        style={styles.logoContainer}
                    >
                        <Ionicons name="leaf" size={20} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.appName, { color: colors.text }]}>AgroMind</Text>
                </View>

                <View style={styles.rightSection}>
                    {/* Botón de notificaciones */}
                    <TouchableOpacity 
                        style={[styles.iconButton, { backgroundColor: colors.background }]}
                        onPress={() => {
                            setShowProfileMenu(false);
                            setShowNotifications(!showNotifications);
                        }}
                        activeOpacity={0.7}
                    >
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                        <Ionicons name="notifications-outline" size={22} color={colors.text} />
                    </TouchableOpacity>

                    {/* Botón de perfil */}
                    <TouchableOpacity 
                        style={styles.profileButton}
                        onPress={() => {
                            setShowNotifications(false);
                            setShowProfileMenu(!showProfileMenu);
                        }}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[Colors.emerald[500], Colors.emerald[700]]}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>
                                {user?.name ? getInitials(user.name) : 'U'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Backdrop */}
            {(showNotifications || showProfileMenu) && (
                <TouchableWithoutFeedback onPress={closeAll}>
                    <Animated.View 
                        style={[
                            styles.backdrop,
                            { opacity: backdropAnim }
                        ]} 
                    />
                </TouchableWithoutFeedback>
            )}

            {/* Dropdown de Notificaciones */}
            {showNotifications && (
                <Animated.View 
                    style={[
                        styles.notificationDropdown,
                        { backgroundColor: colors.card },
                        {
                            opacity: notificationAnim,
                            transform: [
                                { 
                                    translateY: notificationAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-10, 0]
                                    })
                                },
                                {
                                    scale: notificationAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.95, 1]
                                    })
                                }
                            ]
                        }
                    ]}
                >
                    {/* Header minimalista */}
                    <View style={styles.dropdownHeader}>
                        <Text style={[styles.dropdownTitle, { color: colors.text }]}>Notificaciones</Text>
                        {notifications.length > 0 && unreadCount > 0 && (
                            <TouchableOpacity onPress={markAllAsRead}>
                                <Text style={styles.markAllText}>Marcar leídas</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView 
                        style={styles.notificationList} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
                    >
                        {notifications.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={[styles.emptyIcon, { backgroundColor: colors.background }]}>
                                    <Ionicons name="notifications-off-outline" size={32} color={Colors.gray[300]} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin notificaciones</Text>
                                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                    Te notificaremos sobre eventos importantes
                                </Text>
                            </View>
                        ) : (
                            notifications.map((notification, index) => (
                                <TouchableOpacity
                                    key={notification.id}
                                    style={[
                                        styles.notificationItem,
                                        !notification.read && styles.notificationUnread,
                                        index === notifications.length - 1 && { borderBottomWidth: 0 }
                                    ]}
                                    activeOpacity={0.6}
                                    onPress={() => markAsRead(notification.id)}
                                >
                                    <LinearGradient
                                        colors={getNotificationGradient(notification.type)}
                                        style={styles.notificationIndicator}
                                    />
                                    <View style={styles.notificationContent}>
                                        <View style={styles.notificationHeader}>
                                            <Text style={[styles.notificationTitle, { color: colors.text }]}>
                                                {notification.title}
                                            </Text>
                                            <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                                                {getTimeAgo(notification.timestamp)}
                                            </Text>
                                        </View>
                                        <Text 
                                            style={[styles.notificationMessage, { color: colors.textSecondary }]}
                                            numberOfLines={2}
                                        >
                                            {notification.message}
                                        </Text>
                                    </View>
                                    {!notification.read && <View style={styles.unreadDot} />}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>

                    {notifications.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearAllButton}
                            onPress={clearNotifications}
                        >
                            <Text style={styles.clearAllText}>Limpiar todo</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            )}

            {/* Dropdown de Perfil */}
            {showProfileMenu && (
                <Animated.View 
                    style={[
                        styles.profileDropdown,
                        { backgroundColor: colors.card },
                        {
                            opacity: profileAnim,
                            transform: [
                                { 
                                    translateY: profileAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-10, 0]
                                    })
                                },
                                {
                                    scale: profileAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.95, 1]
                                    })
                                }
                            ]
                        }
                    ]}
                >
                    {/* Header con degradado */}
                    <LinearGradient
                        colors={[Colors.emerald[500], Colors.emerald[600]]}
                        style={styles.profileHeader}
                    >
                        <View style={styles.profileAvatarLarge}>
                            <Text style={styles.profileAvatarText}>
                                {user?.name ? getInitials(user.name) : 'U'}
                            </Text>
                        </View>
                        <Text style={styles.profileName}>{user?.name || 'Usuario'}</Text>
                        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
                    </LinearGradient>

                    {/* Opciones */}
                    <View style={styles.profileOptions}>
                        <TouchableOpacity 
                            style={styles.profileOption}
                            onPress={() => {
                                closeAll();
                                router.push('/profile');
                            }}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: Colors.emerald[50] }]}>
                                <Ionicons name="person-outline" size={18} color={Colors.emerald[600]} />
                            </View>
                            <Text style={[styles.optionText, { color: colors.text }]}>Mi Perfil</Text>
                            <Ionicons name="chevron-forward" size={18} color={Colors.gray[300]} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.profileOption}
                            onPress={() => {
                                closeAll();
                                router.push('/(tabs)/configuration');
                            }}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: Colors.blue[50] }]}>
                                <Ionicons name="settings-outline" size={18} color={Colors.blue[500]} />
                            </View>
                            <Text style={[styles.optionText, { color: colors.text }]}>Configuración</Text>
                            <Ionicons name="chevron-forward" size={18} color={Colors.gray[300]} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.profileOption}
                            onPress={() => {
                                closeAll();
                                Alert.alert(
                                    'AgroMind',
                                    'Sistema de Riego Inteligente\nVersión 1.0.0\n\n© 2025 AgroMind',
                                    [{ text: 'OK' }]
                                );
                            }}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: Colors.purple[50] }]}>
                                <Ionicons name="information-circle-outline" size={18} color={Colors.purple[500]} />
                            </View>
                            <Text style={[styles.optionText, { color: colors.text }]}>Acerca de</Text>
                            <Ionicons name="chevron-forward" size={18} color={Colors.gray[300]} />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity 
                            style={styles.logoutOption}
                            onPress={handleLogout}
                            activeOpacity={0.6}
                        >
                            <Ionicons name="log-out-outline" size={18} color={Colors.red[500]} />
                            <Text style={styles.logoutText}>Cerrar sesión</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        zIndex: 100,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    logoContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appName: {
        fontSize: FontSizes.xl,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.red[500],
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    profileButton: {},
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: '#fff',
    },
    // Backdrop
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 998,
    },
    // Notificaciones Dropdown
    notificationDropdown: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 105 : 85,
        right: Spacing.md,
        width: SCREEN_WIDTH - Spacing.md * 2,
        maxWidth: 380,
        maxHeight: 440,
        borderRadius: BorderRadius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 15,
        zIndex: 999,
        overflow: 'hidden',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    dropdownTitle: {
        fontSize: FontSizes.base,
        fontWeight: '700',
    },
    markAllText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        color: Colors.emerald[600],
    },
    notificationList: {
        maxHeight: 320,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: FontSizes.sm,
        textAlign: 'center',
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[50],
    },
    notificationUnread: {
        backgroundColor: Colors.emerald[50] + '30',
    },
    notificationIndicator: {
        width: 4,
        height: '100%',
        minHeight: 40,
        borderRadius: 2,
        marginRight: Spacing.md,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        flex: 1,
    },
    notificationTime: {
        fontSize: FontSizes.xs,
        marginLeft: Spacing.sm,
    },
    notificationMessage: {
        fontSize: FontSizes.sm,
        lineHeight: 18,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.emerald[500],
        marginLeft: Spacing.sm,
        marginTop: 4,
    },
    clearAllButton: {
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
    },
    clearAllText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.gray[400],
    },
    // Profile Dropdown
    profileDropdown: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 105 : 85,
        right: Spacing.md,
        width: 260,
        borderRadius: BorderRadius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 15,
        zIndex: 999,
        overflow: 'hidden',
    },
    profileHeader: {
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
    },
    profileAvatarLarge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    profileAvatarText: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: '#fff',
    },
    profileName: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: FontSizes.xs,
        color: 'rgba(255,255,255,0.8)',
    },
    profileOptions: {
        paddingVertical: Spacing.sm,
    },
    profileOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    optionIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    optionText: {
        flex: 1,
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginVertical: Spacing.xs,
        marginHorizontal: Spacing.lg,
    },
    logoutOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
        backgroundColor: Colors.red[50],
        borderRadius: BorderRadius.lg,
    },
    logoutText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.red[500],
    },
});
