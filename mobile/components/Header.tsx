import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Platform, 
    Modal, 
    Animated,
    ScrollView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import { useRouter } from 'expo-router';
import { API_CONFIG } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    // Cargar notificaciones guardadas al inicio
    useEffect(() => {
        loadNotifications();
    }, []);

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

    const loadNotifications = async () => {
        try {
            const stored = await AsyncStorage.getItem('notifications');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Mantener solo las últimas 24 horas
                const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
                const recent = parsed.filter((n: Notification) => n.timestamp > dayAgo);
                setNotifications(recent);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const saveNotifications = async (notifs: Notification[]) => {
        try {
            await AsyncStorage.setItem('notifications', JSON.stringify(notifs));
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
                    onPress: () => {
                        setNotifications([]);
                        saveNotifications([]);
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

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.leftSection}>
                <View style={styles.logoContainer}>
                    <Ionicons name="leaf" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.appName, { color: colors.text }]}>AgroMind</Text>
            </View>

            <View style={styles.rightSection}>
                {/* Botón de notificaciones */}
                <TouchableOpacity 
                    style={styles.iconButton}
                    onPress={() => setShowNotifications(true)}
                >
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                    <Ionicons name="notifications-outline" size={24} color={colors.text} />
                </TouchableOpacity>

                {/* Botón de perfil */}
                <TouchableOpacity 
                    style={styles.profileButton}
                    onPress={() => setShowProfileMenu(true)}
                >
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>
                            {user?.name ? getInitials(user.name) : 'U'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Dropdown de Notificaciones */}
            {showNotifications && (
                <>
                    <TouchableOpacity
                        style={styles.notificationBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowNotifications(false)}
                    />
                    <View style={[styles.notificationDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.notificationHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.notificationTitle, { color: colors.text }]}>Notificaciones</Text>
                            <View style={styles.notificationHeaderActions}>
                                {notifications.length > 0 && unreadCount > 0 && (
                                    <TouchableOpacity 
                                        onPress={markAllAsRead}
                                        style={styles.markReadButton}
                                    >
                                        <Text style={[styles.markReadText, { color: colors.primary }]}>Marcar todas</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                    <Ionicons name="close" size={22} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={false}>
                            {notifications.length === 0 ? (
                                <View style={styles.emptyNotifications}>
                                    <Ionicons name="notifications-off-outline" size={48} color={colors.border} />
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay notificaciones</Text>
                                </View>
                            ) : (
                                notifications.map(notification => (
                                    <TouchableOpacity
                                        key={notification.id}
                                        style={[
                                            styles.notificationItem,
                                            { borderBottomColor: colors.border },
                                            !notification.read && styles.notificationUnread
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => markAsRead(notification.id)}
                                    >
                                        <View style={[
                                            styles.notificationIcon,
                                            {
                                                backgroundColor:
                                                    notification.type === 'error' ? Colors.red[50] :
                                                    notification.type === 'warning' ? Colors.orange[50] :
                                                    notification.type === 'success' ? Colors.emerald[50] :
                                                    Colors.blue[50]
                                            }
                                        ]}>
                                            <Ionicons
                                                name={
                                                    notification.type === 'error' ? 'alert-circle' :
                                                    notification.type === 'warning' ? 'warning' :
                                                    notification.type === 'success' ? 'checkmark-circle' :
                                                    'information-circle'
                                                }
                                                size={20}
                                                color={
                                                    notification.type === 'error' ? Colors.red[500] :
                                                    notification.type === 'warning' ? Colors.orange[500] :
                                                    notification.type === 'success' ? Colors.emerald[600] :
                                                    Colors.blue[500]
                                                }
                                            />
                                        </View>
                                        <View style={styles.notificationContent}>
                                            <Text style={[styles.notificationItemTitle, { color: colors.text }]}>{notification.title}</Text>
                                            <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>{notification.message}</Text>
                                            <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>{getTimeAgo(notification.timestamp)}</Text>
                                        </View>
                                        {!notification.read && <View style={styles.unreadDot} />}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>

                        {notifications.length > 0 && (
                            <TouchableOpacity
                                style={[styles.clearButton, { borderTopColor: colors.border }]}
                                onPress={clearNotifications}
                            >
                                <Ionicons name="trash-outline" size={16} color={Colors.red[500]} />
                                <Text style={[styles.clearButtonText, { color: Colors.red[500] }]}>Limpiar todas</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            )}

            {/* Modal de Perfil */}
            <Modal
                visible={showProfileMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowProfileMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowProfileMenu(false)}
                >
                    <View style={[styles.profileMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {/* Header del perfil */}
                        <View style={[styles.profileMenuHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                            <View style={[styles.profileMenuAvatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.profileMenuAvatarText}>
                                    {user?.name ? getInitials(user.name) : 'U'}
                                </Text>
                            </View>
                            <View style={styles.profileMenuInfo}>
                                <Text style={[styles.profileMenuName, { color: colors.text }]}>{user?.name || 'Usuario'}</Text>
                                <Text style={[styles.profileMenuEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
                            </View>
                        </View>

                        {/* Opciones del menú */}
                        <View style={styles.profileMenuOptions}>
                            <TouchableOpacity 
                                style={styles.profileMenuItem}
                                onPress={() => {
                                    setShowProfileMenu(false);
                                    router.push('/profile');
                                }}
                            >
                                <Ionicons name="person-outline" size={20} color={colors.text} />
                                <Text style={[styles.profileMenuItemText, { color: colors.text }]}>Mi Perfil</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.profileMenuItem}
                                onPress={() => {
                                    setShowProfileMenu(false);
                                    router.push('/(tabs)/configuration');
                                }}
                            >
                                <Ionicons name="settings-outline" size={20} color={colors.text} />
                                <Text style={[styles.profileMenuItemText, { color: colors.text }]}>Configuración</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.profileMenuItem}
                                onPress={() => {
                                    setShowProfileMenu(false);
                                    // Mostrar info de la app
                                    Alert.alert(
                                        'AgroMind',
                                        'Sistema de Riego Inteligente\nVersión 1.0.0\n\n© 2025 AgroMind',
                                        [{ text: 'OK' }]
                                    );
                                }}
                            >
                                <Ionicons name="information-circle-outline" size={20} color={colors.text} />
                                <Text style={[styles.profileMenuItemText, { color: colors.text }]}>Acerca de</Text>
                            </TouchableOpacity>

                            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                            <TouchableOpacity 
                                style={[styles.profileMenuItem, styles.logoutItem]}
                                onPress={handleLogout}
                            >
                                <Ionicons name="log-out-outline" size={20} color={Colors.red[500]} />
                                <Text style={[styles.profileMenuItemText, styles.logoutText]}>
                                    Cerrar Sesión
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    logoContainer: {
        width: 32,
        height: 32,
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
        padding: Spacing.xs,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.red[500],
        zIndex: 1,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    profileButton: {
        marginLeft: Spacing.xs,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    avatarText: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
    },
    // Notificaciones Dropdown
    notificationBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 998,
    },
    notificationDropdown: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 110 : 90,
        right: Spacing.lg,
        width: 360,
        maxWidth: '90%',
        maxHeight: 500,
        borderRadius: BorderRadius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 999,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    notificationTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
    },
    notificationHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    markReadButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    markReadText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
    notificationList: {
        padding: Spacing.sm,
    },
    emptyNotifications: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl * 2,
    },
    emptyText: {
        fontSize: FontSizes.base,
        marginTop: Spacing.md,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xs,
        marginHorizontal: Spacing.sm,
        borderWidth: 1,
    },
    notificationUnread: {
        backgroundColor: Colors.blue[50],
        borderColor: Colors.blue[100],
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    notificationContent: {
        flex: 1,
    },
    notificationItemTitle: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        marginBottom: 2,
    },
    notificationMessage: {
        fontSize: FontSizes.sm,
        marginBottom: 4,
        lineHeight: 18,
    },
    notificationTime: {
        fontSize: FontSizes.xs,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.blue[500],
        marginLeft: Spacing.sm,
        marginTop: 6,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.xs,
        borderTopWidth: 1,
    },
    clearButtonText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    // Menú de Perfil
    profileMenu: {
        margin: Spacing.lg,
        borderRadius: BorderRadius.xxl,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    profileMenuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.xl,
        borderBottomWidth: 1,
    },
    profileMenuAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
        borderWidth: 3,
    },
    profileMenuAvatarText: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: '#fff',
    },
    profileMenuInfo: {
        flex: 1,
    },
    profileMenuName: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        marginBottom: 2,
    },
    profileMenuEmail: {
        fontSize: FontSizes.sm,
        color: Colors.gray[600],
    },
    profileMenuOptions: {
        padding: Spacing.md,
    },
    profileMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.md,
    },
    profileMenuItemText: {
        fontSize: FontSizes.base,
        fontWeight: '500',
        color: Colors.gray[700],
    },
    menuDivider: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginVertical: Spacing.sm,
    },
    logoutItem: {
        backgroundColor: Colors.red[50],
    },
    logoutText: {
        color: Colors.red[600],
        fontWeight: '600',
    },
});
