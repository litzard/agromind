import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform, 
    ScrollView,
    Modal,
    Animated,
    Clipboard,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTutorial } from '../context/TutorialContext';
import { Button } from '../components/Button';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import { API_CONFIG } from '../constants/api';
import { ActionModal, ActionModalButton } from '../components/ActionModal';

type ConnectionStep = 'idle' | 'creating' | 'connecting' | 'testing' | 'success' | 'error';

export default function AddZoneScreen() {
    const [name, setName] = useState('');
    const [type, setType] = useState<'Outdoor' | 'Indoor' | 'Greenhouse'>('Outdoor');
    const [loading, setLoading] = useState(false);
    const [espConfig, setEspConfig] = useState({
        ssid: '',
        password: '',
        serverUrl: (() => {
            try {
                const parsed = new URL(API_CONFIG.BASE_URL);
                return `${parsed.protocol}//${parsed.host}`;
            } catch (error) {
                return API_CONFIG.BASE_URL.replace(/\/?api$/, '');
            }
        })()
    });
    
    // Estados para el flujo de conexión
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [connectionStep, setConnectionStep] = useState<ConnectionStep>('idle');
    const [createdZoneId, setCreatedZoneId] = useState<number | null>(null);
    const [connectionStatus, setConnectionStatus] = useState({
        zoneCreated: false,
        espConnected: false,
        sensorsReading: false,
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [configCopied, setConfigCopied] = useState(false);
    
    // Animaciones
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const successScale = useRef(new Animated.Value(0)).current;
    
    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: '',
        message: '',
        icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
        buttons: [] as ActionModalButton[]
    });
    const { user } = useAuth();
    const { isActive, nextStep, setCurrentScreen } = useTutorial();
    const router = useRouter();
    
    // Animación de pulso continuo durante conexión
    useEffect(() => {
        if (connectionStep === 'connecting' || connectionStep === 'testing') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [connectionStep]);
    
    // Animación de éxito
    useEffect(() => {
        if (connectionStep === 'success') {
            Animated.spring(successScale, {
                toValue: 1,
                friction: 6,
                tension: 80,
                useNativeDriver: true,
            }).start();
        } else {
            successScale.setValue(0);
        }
    }, [connectionStep]);

    useFocusEffect(
        React.useCallback(() => {
            setCurrentScreen('add-zone');
        }, [setCurrentScreen])
    );

    const closeModal = () => setModalConfig(prev => ({ ...prev, visible: false }));

    const showModal = (config: {
        title: string;
        message: string;
        icon?: keyof typeof Ionicons.glyphMap;
        buttons: ActionModalButton[];
    }) => {
        setModalConfig({
            visible: true,
            title: config.title,
            message: config.message,
            icon: config.icon ?? 'information-circle',
            buttons: config.buttons,
        });
    };

    const copyConfigToClipboard = () => {
        if (!createdZoneId) return;
        const config = `const char* ssid = "${espConfig.ssid}";
const char* password = "${espConfig.password}";
const char* serverUrl = "${espConfig.serverUrl}/api/iot/sensor-data";
const int zoneId = ${createdZoneId};`;
        
        Clipboard.setString(config);
        setConfigCopied(true);
        setTimeout(() => setConfigCopied(false), 2000);
    };

    const resetConnectionFlow = () => {
        setShowConnectionModal(false);
        setConnectionStep('idle');
        setConnectionStatus({ zoneCreated: false, espConnected: false, sensorsReading: false });
        setCreatedZoneId(null);
        setErrorMessage('');
        progressAnim.setValue(0);
    };

    const deleteZoneOnError = async (zoneId: number) => {
        try {
            await fetch(`${API_CONFIG.BASE_URL}/zones/${zoneId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Error deleting zone:', error);
        }
    };

    const handleCreateZone = async () => {
        if (!name.trim()) {
            showModal({
                title: 'Falta el nombre',
                message: 'Ingresa un nombre descriptivo para identificar tu zona.',
                buttons: [{ label: 'Entendido', variant: 'primary', onPress: closeModal }]
            });
            return;
        }

        if (!espConfig.ssid.trim() || !espConfig.password.trim()) {
            showModal({
                title: 'Configura tu WiFi',
                message: 'El ESP32 necesita el nombre y la contraseña de la red para poder conectarse.',
                icon: 'wifi',
                buttons: [{ label: 'Completar', variant: 'primary', onPress: closeModal }]
            });
            return;
        }

        // Iniciar flujo de conexión
        setShowConnectionModal(true);
        setConnectionStep('creating');
        setLoading(true);
        
        try {
            // Paso 1: Crear la zona
            Animated.timing(progressAnim, {
                toValue: 0.33,
                duration: 500,
                useNativeDriver: false,
            }).start();
            
            const defaultSensors = {
                soilMoisture: null,
                temperature: null,
                humidity: null,
                lightLevel: null,
                tankLevel: null,
                waterLevel: null
            };

            const defaultStatus = {
                pump: 'OFF',
                connection: 'OFFLINE',
                lastWatered: 'Nunca',
                lastUpdate: null,
                hasSensorData: false
            };

            const defaultConfig = {
                moistureThreshold: 30,
                wateringDuration: 10,
                autoMode: false,
                respectRainForecast: false,
                useWeatherApi: false
            };

            const response = await fetch(`${API_CONFIG.BASE_URL}/zones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    name,
                    type,
                    sensors: defaultSensors,
                    status: defaultStatus,
                    config: defaultConfig
                }),
            });

            if (!response.ok) {
                throw new Error('Error al crear la zona en el servidor');
            }

            const data = await response.json();
            const newZoneId = data.id;
            setCreatedZoneId(newZoneId);
            setConnectionStatus(prev => ({ ...prev, zoneCreated: true }));
            
            // Paso 2: Esperar conexión del ESP32
            setConnectionStep('connecting');
            Animated.timing(progressAnim, {
                toValue: 0.66,
                duration: 500,
                useNativeDriver: false,
            }).start();
            
            // Dar tiempo para que el usuario configure el ESP32
            // y verificar si el ESP32 se conecta (máximo 30 segundos con reintentos)
            let espConnected = false;
            const maxAttempts = 10;
            const delayBetweenAttempts = 3000; // 3 segundos
            
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
                
                try {
                    const zoneCheck = await fetch(`${API_CONFIG.BASE_URL}/zones/detail/${newZoneId}`);
                    if (zoneCheck.ok) {
                        const zoneData = await zoneCheck.json();
                        
                        // Verificar si el ESP32 ha enviado datos
                        if (zoneData.status?.connection === 'ONLINE' || 
                            zoneData.status?.lastUpdate || 
                            zoneData.status?.hasSensorData) {
                            espConnected = true;
                            setConnectionStatus(prev => ({ ...prev, espConnected: true }));
                            break;
                        }
                    }
                } catch (error) {
                    console.log('Checking ESP32 connection...', attempt + 1);
                }
            }
            
            if (!espConnected) {
                // El ESP32 no se conectó, eliminar la zona y mostrar error
                await deleteZoneOnError(newZoneId);
                setConnectionStep('error');
                setErrorMessage('El ESP32 no respondió. Verifica que esté encendido y que los datos de WiFi sean correctos.');
                return;
            }
            
            // Paso 3: Verificar lectura de sensores
            setConnectionStep('testing');
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false,
            }).start();
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verificar que hay datos de sensores
            const finalCheck = await fetch(`${API_CONFIG.BASE_URL}/zones/detail/${newZoneId}`);
            if (finalCheck.ok) {
                const finalData = await finalCheck.json();
                if (finalData.sensors && (
                    finalData.sensors.soilMoisture !== null ||
                    finalData.sensors.temperature !== null ||
                    finalData.sensors.tankLevel !== null
                )) {
                    setConnectionStatus(prev => ({ ...prev, sensorsReading: true }));
                }
            }
            
            // ¡Éxito!
            setConnectionStep('success');
            
            // Si el tutorial está activo, avanzar al siguiente paso
            if (isActive) {
                nextStep();
            }
            
        } catch (error) {
            console.error('Create zone error:', error);
            setConnectionStep('error');
            setErrorMessage(error instanceof Error ? error.message : 'Error al crear la zona. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        if (createdZoneId) {
            router.replace({
                pathname: '/(tabs)',
                params: { zoneId: createdZoneId.toString() }
            });
        } else {
            router.replace('/(tabs)');
        }
    };

    const handleRetry = () => {
        resetConnectionFlow();
        // Pequeño delay antes de reintentar
        setTimeout(() => handleCreateZone(), 300);
    };

    const getStepStatus = (step: 'zone' | 'esp' | 'sensors') => {
        switch (step) {
            case 'zone':
                return connectionStatus.zoneCreated ? 'done' : 
                       connectionStep === 'creating' ? 'active' : 'pending';
            case 'esp':
                return connectionStatus.espConnected ? 'done' : 
                       connectionStep === 'connecting' ? 'active' : 'pending';
            case 'sensors':
                return connectionStatus.sensorsReading ? 'done' : 
                       connectionStep === 'testing' ? 'active' : 'pending';
        }
    };

    const ZoneTypeOption = ({ value, label, icon, color }: { value: typeof type, label: string, icon: any, color: string }) => (
        <TouchableOpacity
            style={[
                styles.typeOption,
                type === value && styles.typeOptionActive,
                { borderColor: type === value ? color : Colors.gray[200] }
            ]}
            onPress={() => setType(value)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: type === value ? color + '20' : Colors.gray[100] }]}>
                <Ionicons name={icon} size={24} color={type === value ? color : Colors.gray[500]} />
            </View>
            <Text style={[styles.typeLabel, type === value && { color: color, fontWeight: '700' }]}>{label}</Text>
            {type === value && (
                <View style={[styles.checkIcon, { backgroundColor: color }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.gray[700]} />
                </TouchableOpacity>
                <Text style={styles.title}>Nueva Zona</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.formSection}>
                    <Text style={styles.label}>Nombre de la Zona</Text>
                    <View 
                        style={styles.inputContainer}
                        // @ts-ignore
                        nativeID="zone-name-input"
                    >
                        <Ionicons name="pricetag-outline" size={20} color={Colors.gray[400]} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. Jardín Trasero"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={Colors.gray[400]}
                        />
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Tipo de Zona</Text>
                    <View 
                        style={styles.typesGrid}
                        // @ts-ignore
                        nativeID="zone-type-select"
                    >
                        <ZoneTypeOption
                            value="Outdoor"
                            label="Exterior"
                            icon="leaf"
                            color={Colors.emerald[600]}
                        />
                        <ZoneTypeOption
                            value="Indoor"
                            label="Interior"
                            icon="home"
                            color={Colors.blue[600]}
                        />
                        <ZoneTypeOption
                            value="Greenhouse"
                            label="Invernadero"
                            icon="flower"
                            color={Colors.orange[500]}
                        />
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={24} color={Colors.blue[500]} />
                    <Text style={styles.infoText}>
                        La zona se creará con una configuración predeterminada que podrás ajustar más tarde.
                    </Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Configura tu ESP32</Text>
                    <View style={styles.espCard}>
                        <Text style={styles.espDescription}>
                            Estos datos se usarán para conectar el ESP32 inmediatamente después de crear la zona.
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons name="wifi" size={20} color={Colors.gray[400]} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="SSID de tu red"
                                value={espConfig.ssid}
                                onChangeText={(text) => setEspConfig(prev => ({ ...prev, ssid: text }))}
                                placeholderTextColor={Colors.gray[400]}
                            />
                        </View>

                        <View style={[styles.inputContainer, { marginTop: Spacing.sm }]}>
                            <Ionicons name="lock-closed" size={20} color={Colors.gray[400]} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Contraseña WiFi"
                                secureTextEntry
                                value={espConfig.password}
                                onChangeText={(text) => setEspConfig(prev => ({ ...prev, password: text }))}
                                placeholderTextColor={Colors.gray[400]}
                            />
                        </View>
                    </View>
                </View>

                <Button
                    title="Crear zona y conectar ESP32"
                    onPress={handleCreateZone}
                    loading={loading}
                    style={styles.submitButton}
                    // @ts-ignore
                    nativeID="create-zone-button"
                />
            </ScrollView>
            <TutorialOverlay />
            <ActionModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                message={modalConfig.message}
                icon={modalConfig.icon}
                buttons={modalConfig.buttons}
                onClose={closeModal}
            />
            
            {/* Modal de Conexión ESP32 */}
            <Modal
                visible={showConnectionModal}
                transparent
                animationType="fade"
                onRequestClose={() => {}}
                statusBarTranslucent
            >
                <View style={styles.connectionModalOverlay}>
                    <View style={styles.connectionModalCard}>
                        {/* Header */}
                        <View style={styles.connectionModalHeader}>
                            <View style={styles.connectionModalIconWrapper}>
                                <Ionicons 
                                    name={connectionStep === 'error' ? 'alert-circle' : 'hardware-chip'} 
                                    size={28} 
                                    color={connectionStep === 'error' ? Colors.red[500] : Colors.emerald[600]} 
                                />
                            </View>
                            <Text style={styles.connectionModalTitle}>
                                {connectionStep === 'success' ? '¡Conexión Exitosa!' :
                                 connectionStep === 'error' ? 'Error de Conexión' :
                                 'Conectando ESP32'}
                            </Text>
                        </View>

                        {/* Contenido según el paso */}
                        {connectionStep !== 'success' && connectionStep !== 'error' && (
                            <View style={styles.connectionContent}>
                                {/* Barra de progreso */}
                                <View style={styles.progressBarContainer}>
                                    <Animated.View 
                                        style={[
                                            styles.progressBarFill,
                                            { 
                                                width: progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%']
                                                })
                                            }
                                        ]} 
                                    />
                                </View>

                                {/* Pasos de conexión */}
                                <View style={styles.stepsContainer}>
                                    <ConnectionStepItem 
                                        number={1}
                                        title="Creando zona"
                                        subtitle="Registrando en el servidor"
                                        status={getStepStatus('zone')}
                                        pulseAnim={pulseAnim}
                                    />
                                    <View style={styles.stepConnector} />
                                    <ConnectionStepItem 
                                        number={2}
                                        title="Esperando ESP32"
                                        subtitle="Configura y enciende tu dispositivo"
                                        status={getStepStatus('esp')}
                                        pulseAnim={pulseAnim}
                                    />
                                    <View style={styles.stepConnector} />
                                    <ConnectionStepItem 
                                        number={3}
                                        title="Leyendo sensores"
                                        subtitle="Verificando datos del sistema"
                                        status={getStepStatus('sensors')}
                                        pulseAnim={pulseAnim}
                                    />
                                </View>

                                {/* Instrucciones del ESP32 */}
                                {connectionStep === 'connecting' && (
                                    <View style={styles.espInstructions}>
                                        <Text style={styles.espInstructionsTitle}>Configura tu ESP32:</Text>
                                        
                                        <View style={styles.configDataSection}>
                                            <View style={styles.configItem}>
                                                <View style={[styles.configItemIcon, { backgroundColor: Colors.blue[50] }]}>
                                                    <Ionicons name="wifi" size={16} color={Colors.blue[500]} />
                                                </View>
                                                <View style={styles.configItemContent}>
                                                    <Text style={styles.configItemLabel}>WiFi</Text>
                                                    <Text style={styles.configItemValue}>{espConfig.ssid}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.configItem}>
                                                <View style={[styles.configItemIcon, { backgroundColor: Colors.emerald[50] }]}>
                                                    <Ionicons name="location" size={16} color={Colors.emerald[600]} />
                                                </View>
                                                <View style={styles.configItemContent}>
                                                    <Text style={styles.configItemLabel}>Zone ID</Text>
                                                    <Text style={styles.configItemValue}>{createdZoneId || '-'}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        
                                        <TouchableOpacity 
                                            style={[styles.copyButton, configCopied && styles.copyButtonSuccess]}
                                            onPress={copyConfigToClipboard}
                                        >
                                            <Ionicons 
                                                name={configCopied ? "checkmark" : "copy"} 
                                                size={18} 
                                                color={configCopied ? Colors.emerald[600] : Colors.gray[600]} 
                                            />
                                            <Text style={[styles.copyButtonText, configCopied && styles.copyButtonTextSuccess]}>
                                                {configCopied ? '¡Código copiado!' : 'Copiar código Arduino'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Vista de éxito */}
                        {connectionStep === 'success' && (
                            <Animated.View style={[styles.successContent, { transform: [{ scale: successScale }] }]}>
                                <LinearGradient
                                    colors={[Colors.emerald[400], Colors.emerald[600]]}
                                    style={styles.successIconCircle}
                                >
                                    <Ionicons name="checkmark" size={48} color="#fff" />
                                </LinearGradient>
                                
                                <Text style={styles.successText}>
                                    Tu zona "{name}" está lista y el ESP32 está enviando datos correctamente.
                                </Text>
                                
                                <View style={styles.successStats}>
                                    <View style={styles.successStatItem}>
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.emerald[500]} />
                                        <Text style={styles.successStatText}>Zona creada</Text>
                                    </View>
                                    <View style={styles.successStatItem}>
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.emerald[500]} />
                                        <Text style={styles.successStatText}>ESP32 conectado</Text>
                                    </View>
                                    <View style={styles.successStatItem}>
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.emerald[500]} />
                                        <Text style={styles.successStatText}>Sensores activos</Text>
                                    </View>
                                </View>
                                
                                <TouchableOpacity style={styles.successButton} onPress={handleFinish}>
                                    <Text style={styles.successButtonText}>Ir al Dashboard</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* Vista de error */}
                        {connectionStep === 'error' && (
                            <View style={styles.errorContent}>
                                <View style={styles.errorIconCircle}>
                                    <Ionicons name="close" size={40} color={Colors.red[500]} />
                                </View>
                                
                                <Text style={styles.errorText}>{errorMessage}</Text>
                                
                                <View style={styles.errorActions}>
                                    <TouchableOpacity 
                                        style={styles.errorSecondaryButton}
                                        onPress={resetConnectionFlow}
                                    >
                                        <Text style={styles.errorSecondaryText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.errorPrimaryButton}
                                        onPress={handleRetry}
                                    >
                                        <Ionicons name="refresh" size={18} color="#fff" />
                                        <Text style={styles.errorPrimaryText}>Reintentar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

// Componente para cada paso de conexión
const ConnectionStepItem = ({ 
    number, 
    title, 
    subtitle, 
    status, 
    pulseAnim 
}: { 
    number: number; 
    title: string; 
    subtitle: string; 
    status: 'pending' | 'active' | 'done';
    pulseAnim: Animated.Value;
}) => {
    const getCircleContent = () => {
        if (status === 'done') {
            return (
                <View style={[styles.stepCircleDone]}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                </View>
            );
        }
        if (status === 'active') {
            return (
                <Animated.View style={[styles.stepCircleActive, { transform: [{ scale: pulseAnim }] }]}>
                    <ActivityIndicator size="small" color="#fff" />
                </Animated.View>
            );
        }
        return (
            <View style={styles.stepCirclePending}>
                <Text style={styles.stepCircleText}>{number}</Text>
            </View>
        );
    };

    return (
        <View style={styles.stepItem}>
            {getCircleContent()}
            <View style={styles.stepTextContainer}>
                <Text style={[
                    styles.stepTitle,
                    status === 'done' && styles.stepTitleDone,
                    status === 'active' && styles.stepTitleActive,
                ]}>{title}</Text>
                <Text style={styles.stepSubtitle}>{subtitle}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    backButton: {
        padding: Spacing.xs,
        marginRight: Spacing.md,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.gray[900],
    },
    content: {
        padding: Spacing.lg,
    },
    formSection: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        color: Colors.gray[700],
        marginBottom: Spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        height: 56,
    },
    inputIcon: {
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: FontSizes.base,
        color: Colors.gray[900],
    },
    typesGrid: {
        gap: Spacing.md,
    },
    typeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: Colors.gray[200],
    },
    typeOptionActive: {
        backgroundColor: '#fff',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    typeLabel: {
        flex: 1,
        fontSize: FontSizes.base,
        color: Colors.gray[600],
    },
    checkIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.blue[50],
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    infoText: {
        flex: 1,
        fontSize: FontSizes.sm,
        color: Colors.blue[800],
        lineHeight: 20,
    },
    espCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    espDescription: {
        color: Colors.gray[600],
        fontSize: FontSizes.sm,
        lineHeight: 20,
        marginBottom: Spacing.sm,
    },
    submitButton: {
        marginTop: Spacing.sm,
    },
    // Modal de conexión
    connectionModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.md,
    },
    connectionModalCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: BorderRadius.xxl,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 40,
        elevation: 20,
    },
    connectionModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    connectionModalIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.emerald[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    connectionModalTitle: {
        flex: 1,
        fontSize: FontSizes.xl,
        fontWeight: '800',
        color: Colors.gray[900],
    },
    connectionContent: {
        padding: Spacing.lg,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: Colors.gray[100],
        borderRadius: 3,
        marginBottom: Spacing.xl,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.emerald[500],
        borderRadius: 3,
    },
    stepsContainer: {
        gap: 0,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    stepConnector: {
        width: 2,
        height: 24,
        backgroundColor: Colors.gray[200],
        marginLeft: 19,
        marginVertical: 4,
    },
    stepCircleDone: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.emerald[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleActive: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.emerald[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCirclePending: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gray[200],
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleText: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: Colors.gray[500],
    },
    stepTextContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        color: Colors.gray[500],
    },
    stepTitleDone: {
        color: Colors.emerald[700],
        fontWeight: '700',
    },
    stepTitleActive: {
        color: Colors.gray[900],
        fontWeight: '700',
    },
    stepSubtitle: {
        fontSize: FontSizes.sm,
        color: Colors.gray[400],
        marginTop: 2,
    },
    espInstructions: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        backgroundColor: Colors.gray[50],
        borderRadius: BorderRadius.lg,
    },
    espInstructionsTitle: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
        color: Colors.gray[800],
        marginBottom: Spacing.md,
    },
    configDataSection: {
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    configItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    configItemIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    configItemContent: {
        flex: 1,
    },
    configItemLabel: {
        fontSize: FontSizes.xs,
        color: Colors.gray[500],
    },
    configItemValue: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.gray[800],
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.gray[100],
        borderRadius: BorderRadius.lg,
    },
    copyButtonSuccess: {
        backgroundColor: Colors.emerald[50],
    },
    copyButtonText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.gray[600],
    },
    copyButtonTextSuccess: {
        color: Colors.emerald[600],
    },
    // Éxito
    successContent: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    successText: {
        fontSize: FontSizes.base,
        color: Colors.gray[600],
        textAlign: 'center',
        marginBottom: Spacing.lg,
        lineHeight: 22,
    },
    successStats: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    successStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    successStatText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        color: Colors.gray[600],
    },
    successButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.emerald[600],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.lg,
        width: '100%',
        shadowColor: Colors.emerald[600],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    successButtonText: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: '#fff',
    },
    // Error
    errorContent: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    errorIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.red[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    errorText: {
        fontSize: FontSizes.base,
        color: Colors.gray[600],
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    errorActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        width: '100%',
    },
    errorSecondaryButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
    },
    errorSecondaryText: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: Colors.gray[700],
    },
    errorPrimaryButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.emerald[600],
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    errorPrimaryText: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: '#fff',
    },
});
