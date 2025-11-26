import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import { API_CONFIG } from '../constants/api';
import { ActionModal, ActionModalButton } from '../components/ActionModal';

export default function ConnectESP32Screen() {
    const router = useRouter();
    const { colors } = useTheme();
    const params = useLocalSearchParams();
    const rawZoneId = params.zoneId;
    const zoneId = Array.isArray(rawZoneId) ? rawZoneId[0] : rawZoneId;

    const getDefaultServerUrl = () => {
        const baseUrl = API_CONFIG.BASE_URL;
        try {
            const parsedUrl = new URL(baseUrl);
            return `${parsedUrl.protocol}//${parsedUrl.host}`;
        } catch (error) {
            return baseUrl.replace(/\/?api$/, '');
        }
    };

    const [step, setStep] = useState(1); // 1: WiFi Config, 2: Testing Connection, 3: Success
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: '',
        message: '',
        icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
        buttons: [] as ActionModalButton[]
    });
    
    // Datos del ESP32
    const [espConfig, setEspConfig] = useState(() => ({
        ssid: typeof params.ssid === 'string' ? params.ssid : '',
        password: typeof params.password === 'string' ? params.password : '',
        serverUrl: typeof params.serverUrl === 'string' && params.serverUrl.trim() !== ''
            ? params.serverUrl
            : getDefaultServerUrl(),
        zoneId: zoneId || '1'
    }));

    const [connectionStatus, setConnectionStatus] = useState({
        wifi: false,
        server: false,
        sensors: false
    });

    const closeModal = () => setModalConfig(prev => ({ ...prev, visible: false }));

    const showModal = (config: {
        title: string;
        message?: string;
        icon?: keyof typeof Ionicons.glyphMap;
        buttons: ActionModalButton[];
    }) => {
        setModalConfig({
            visible: true,
            title: config.title,
            message: config.message ?? '',
            icon: config.icon ?? 'information-circle',
            buttons: config.buttons,
        });
    };

    const testESPConnection = async () => {
        setLoading(true);
        setStep(2);

        try {
            // Simular prueba de conexión WiFi
            setConnectionStatus(prev => ({ ...prev, wifi: true }));
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (!zoneId) {
                throw new Error('Zona no especificada');
            }

            const zoneDetailUrl = `${API_CONFIG.BASE_URL}/zones/detail/${zoneId}`;

            // Probar conexión con servidor
            const response = await fetch(zoneDetailUrl);
            if (response.ok) {
                setConnectionStatus(prev => ({ ...prev, server: true }));
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Probar lectura de sensores
            const sensorsResponse = await fetch(zoneDetailUrl);
            if (sensorsResponse.ok) {
                const data = await sensorsResponse.json();
                if (data.sensors) {
                    setConnectionStatus(prev => ({ ...prev, sensors: true }));
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    setStep(3);
                }
            }
        } catch (error) {
            console.error('Error en prueba de conexión:', error);
            showModal({
                title: 'Error de Conexión',
                message: 'No se pudo conectar con el ESP32. Verifica que esté encendido y que los datos sean correctos.',
                icon: 'alert-circle',
                buttons: [
                    { label: 'Volver', onPress: () => { closeModal(); setStep(1); } },
                    { label: 'Reintentar', onPress: () => { closeModal(); testESPConnection(); }, variant: 'primary' }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        if (!espConfig.ssid || !espConfig.password) {
            showModal({
                title: 'Completa los datos',
                message: 'Necesitas ingresar el nombre y la contraseña de tu WiFi para continuar.',
                icon: 'information-circle',
                buttons: [{ label: 'Entendido', onPress: closeModal, variant: 'primary' }]
            });
            return;
        }

        const infoMessage = [
            '1. Conecta el ESP32 a la corriente.',
            '2. Abre tu código e ingresa:',
            `   • WiFi SSID: "${espConfig.ssid}"`,
            `   • WiFi Password: "${espConfig.password}"`,
            `   • Server URL: "${espConfig.serverUrl}"`,
            `   • Zone ID: ${espConfig.zoneId}`,
            '3. Sube el firmware al ESP32.',
            '4. Presiona "Probar conexión" para verificar.'
        ].join('\n');

        showModal({
            title: 'Configurar ESP32',
            message: infoMessage,
            icon: 'hardware-chip',
            buttons: [
                { label: 'Cerrar', onPress: closeModal },
                {
                    label: 'Copiar Config',
                    icon: 'copy',
                    onPress: () => {
                        copyConfig();
                        closeModal();
                    }
                },
                {
                    label: 'Probar Conexión',
                    variant: 'primary',
                    onPress: () => {
                        closeModal();
                        testESPConnection();
                    }
                }
            ]
        });
    };

    const copyConfig = () => {
        const config = `
const char* ssid = "${espConfig.ssid}";
const char* password = "${espConfig.password}";
const char* serverUrl = "${espConfig.serverUrl}/api/iot/sensor-data";
const int zoneId = ${espConfig.zoneId};
        `.trim();

        showModal({
            title: 'Configuración copiada',
            message: 'Pega esta configuración en tu código Arduino:\n\n' + config,
            icon: 'clipboard',
            buttons: [{ label: 'Listo', onPress: closeModal, variant: 'primary' }]
        });
    };

    const handleFinish = () => {
        showModal({
            title: '¡Conexión exitosa!',
            message: 'El ESP32 está enviando datos correctamente. Revisa el dashboard para ver las lecturas en tiempo real.',
            icon: 'checkmark-circle',
            buttons: [{ label: 'Ir al Dashboard', variant: 'primary', onPress: () => { closeModal(); router.replace('/(tabs)'); } }]
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Header />
            
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                    <Text style={[styles.backText, { color: colors.text }]}>Volver</Text>
                </TouchableOpacity>

                <Text style={[styles.title, { color: colors.text }]}>Conectar ESP32</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Zona ID: {zoneId}
                </Text>

                {/* Progress Steps */}
                <View style={styles.stepsContainer}>
                    <View style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            { backgroundColor: step >= 1 ? colors.primary : colors.border }
                        ]}>
                            <Text style={styles.stepNumber}>1</Text>
                        </View>
                        <Text style={[styles.stepLabel, { color: step >= 1 ? colors.text : colors.textSecondary }]}>
                            Configurar
                        </Text>
                    </View>

                    <View style={[styles.stepLine, { backgroundColor: step >= 2 ? colors.primary : colors.border }]} />

                    <View style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            { backgroundColor: step >= 2 ? colors.primary : colors.border }
                        ]}>
                            <Text style={styles.stepNumber}>2</Text>
                        </View>
                        <Text style={[styles.stepLabel, { color: step >= 2 ? colors.text : colors.textSecondary }]}>
                            Probar
                        </Text>
                    </View>

                    <View style={[styles.stepLine, { backgroundColor: step >= 3 ? colors.primary : colors.border }]} />

                    <View style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            { backgroundColor: step >= 3 ? colors.primary : colors.border }
                        ]}>
                            <Text style={styles.stepNumber}>3</Text>
                        </View>
                        <Text style={[styles.stepLabel, { color: step >= 3 ? colors.text : colors.textSecondary }]}>
                            Listo
                        </Text>
                    </View>
                </View>

                {/* Step 1: WiFi Configuration */}
                {step === 1 && (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="wifi" size={24} color={colors.primary} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Configuración WiFi</Text>
                        </View>

                        <Text style={[styles.label, { color: colors.textSecondary }]}>SSID de tu WiFi</Text>
                        <TextInput
                            style={[styles.input, { 
                                backgroundColor: colors.background, 
                                borderColor: colors.border,
                                color: colors.text 
                            }]}
                            placeholder="Nombre de tu red WiFi"
                            placeholderTextColor={colors.textSecondary}
                            value={espConfig.ssid}
                            onChangeText={(text) => setEspConfig(prev => ({ ...prev, ssid: text }))}
                            autoCapitalize="none"
                        />

                        <Text style={[styles.label, { color: colors.textSecondary }]}>Contraseña WiFi</Text>
                        <TextInput
                            style={[styles.input, { 
                                backgroundColor: colors.background, 
                                borderColor: colors.border,
                                color: colors.text 
                            }]}
                            placeholder="Contraseña de tu WiFi"
                            placeholderTextColor={colors.textSecondary}
                            value={espConfig.password}
                            onChangeText={(text) => setEspConfig(prev => ({ ...prev, password: text }))}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <Text style={[styles.label, { color: colors.textSecondary }]}>URL del Servidor</Text>
                        <TextInput
                            style={[styles.input, { 
                                backgroundColor: colors.background, 
                                borderColor: colors.border,
                                color: colors.text 
                            }]}
                            placeholder="http://192.168.1.100:3000"
                            placeholderTextColor={colors.textSecondary}
                            value={espConfig.serverUrl}
                            onChangeText={(text) => setEspConfig(prev => ({ ...prev, serverUrl: text }))}
                            autoCapitalize="none"
                            keyboardType="url"
                        />

                        <View style={[styles.infoBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                            <Ionicons name="information-circle" size={20} color={colors.primary} />
                            <Text style={[styles.infoText, { color: colors.text }]}>
                                Asegúrate de que tu ESP32 esté en el rango de tu red WiFi
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: colors.primary }]}
                            onPress={handleConnect}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>Continuar</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Step 2: Testing Connection */}
                {step === 2 && (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="sync" size={24} color={colors.primary} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Probando Conexión</Text>
                        </View>

                        <View style={styles.testItem}>
                            <View style={styles.testInfo}>
                                <Ionicons name="wifi" size={20} color={colors.text} />
                                <Text style={[styles.testLabel, { color: colors.text }]}>Conexión WiFi</Text>
                            </View>
                            {connectionStatus.wifi ? (
                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            ) : (
                                <ActivityIndicator size="small" color={colors.primary} />
                            )}
                        </View>

                        <View style={styles.testItem}>
                            <View style={styles.testInfo}>
                                <Ionicons name="server" size={20} color={colors.text} />
                                <Text style={[styles.testLabel, { color: colors.text }]}>Conexión con Servidor</Text>
                            </View>
                            {connectionStatus.server ? (
                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            ) : connectionStatus.wifi ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Ionicons name="ellipse-outline" size={24} color={colors.border} />
                            )}
                        </View>

                        <View style={styles.testItem}>
                            <View style={styles.testInfo}>
                                <Ionicons name="speedometer" size={20} color={colors.text} />
                                <Text style={[styles.testLabel, { color: colors.text }]}>Lectura de Sensores</Text>
                            </View>
                            {connectionStatus.sensors ? (
                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            ) : connectionStatus.server ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Ionicons name="ellipse-outline" size={24} color={colors.border} />
                            )}
                        </View>
                    </View>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.successContainer}>
                            <View style={[styles.successIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
                            </View>
                            <Text style={[styles.successTitle, { color: colors.text }]}>¡Conexión Exitosa!</Text>
                            <Text style={[styles.successText, { color: colors.textSecondary }]}>
                                El ESP32 está conectado y enviando datos correctamente
                            </Text>

                            <View style={[styles.statsContainer, { backgroundColor: colors.background }]}>
                                <View style={styles.statItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>WiFi</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Servidor</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sensores</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.primary }]}
                                onPress={handleFinish}
                            >
                                <Text style={styles.buttonText}>Ir al Dashboard</Text>
                                <Ionicons name="home" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
            <ActionModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                message={modalConfig.message}
                icon={modalConfig.icon}
                buttons={modalConfig.buttons}
                onClose={closeModal}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    backText: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FontSizes.base,
        marginBottom: Spacing.xl,
    },
    stepsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
    },
    stepItem: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    stepNumber: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: '#fff',
    },
    stepLabel: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
    stepLine: {
        flex: 1,
        height: 2,
        marginHorizontal: Spacing.xs,
    },
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    cardTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
    },
    label: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        marginBottom: Spacing.xs,
        marginTop: Spacing.md,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSizes.base,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginTop: Spacing.lg,
    },
    infoText: {
        flex: 1,
        fontSize: FontSizes.sm,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.lg,
    },
    buttonText: {
        color: '#fff',
        fontSize: FontSizes.base,
        fontWeight: '700',
    },
    testItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    testInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    testLabel: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    successTitle: {
        fontSize: FontSizes['2xl'],
        fontWeight: '800',
        marginBottom: Spacing.xs,
    },
    successText: {
        fontSize: FontSizes.base,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xl,
    },
    statItem: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statLabel: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
});
