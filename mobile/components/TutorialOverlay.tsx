import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTutorial } from '../context/TutorialContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TutorialOverlayProps {
    targetPosition?: { x: number; y: number; width: number; height: number };
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ targetPosition }) => {
    const { isActive, currentStep, steps, nextStep, skipTutorial, currentScreen } = useTutorial();
    const router = useRouter();
    
    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const positionY = useRef(new Animated.Value(80)).current; // Posición inicial desde abajo
    
    // Estado para minimizar/expandir
    const [isMinimized, setIsMinimized] = useState(false);
    const minimizeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isActive) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            if (targetPosition) {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.1,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            }
        }
    }, [isActive, currentStep, targetPosition]);

    const toggleMinimize = () => {
        Animated.spring(minimizeAnim, {
            toValue: isMinimized ? 1 : 0,
            friction: 8,
            useNativeDriver: true,
        }).start();
        setIsMinimized(!isMinimized);
    };

    if (!isActive || !steps[currentStep]) return null;

    const currentStepData = steps[currentStep];
    
    // Solo mostrar si estamos en la pantalla correcta
    if (currentStepData.screen !== currentScreen) return null;

    const handleNext = () => {
        if (currentStepData.nextScreen) {
            router.push(currentStepData.nextScreen as any);
        }
        nextStep();
    };

    const getStepIcon = () => {
        switch (currentStepData.actionType) {
            case 'tap-button': return 'hand-left';
            case 'navigate': return 'arrow-forward';
            case 'create-zone': return 'checkmark-circle';
            default: return 'information-circle';
        }
    };

    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <>
            {/* Highlight del elemento target */}
            {targetPosition && !isMinimized && (
                <View style={styles.highlightContainer} pointerEvents="none">
                    <Animated.View
                        style={[
                            styles.highlight,
                            {
                                left: targetPosition.x - 8,
                                top: targetPosition.y - 8,
                                width: targetPosition.width + 16,
                                height: targetPosition.height + 16,
                                transform: [{ scale: pulseAnim }],
                            },
                        ]}
                    />
                </View>
            )}

            {/* Overlay flotante */}
            <Animated.View
                style={[
                    styles.floatingOverlay,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { scale: scaleAnim },
                            { 
                                translateY: minimizeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [200, 0]
                                })
                            }
                        ],
                    },
                ]}
            >
                {/* Vista minimizada */}
                {isMinimized ? (
                    <TouchableOpacity 
                        style={styles.minimizedView}
                        onPress={toggleMinimize}
                        activeOpacity={0.9}
                    >
                        <View style={styles.minimizedContent}>
                            <View style={styles.minimizedIconBadge}>
                                <Ionicons name="school" size={18} color="#fff" />
                            </View>
                            <Text style={styles.minimizedText}>Tutorial</Text>
                            <Text style={styles.minimizedStep}>{currentStep + 1}/{steps.length}</Text>
                        </View>
                        <Ionicons name="chevron-up" size={20} color={Colors.gray[400]} />
                    </TouchableOpacity>
                ) : (
                    /* Vista expandida */
                    <View style={styles.expandedView}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <View style={styles.stepBadge}>
                                    <Text style={styles.stepBadgeText}>{currentStep + 1}</Text>
                                </View>
                                <Text style={styles.headerTitle}>Tutorial</Text>
                            </View>
                            <View style={styles.headerActions}>
                                <TouchableOpacity 
                                    style={styles.iconButton}
                                    onPress={toggleMinimize}
                                >
                                    <Ionicons name="chevron-down" size={20} color={Colors.gray[500]} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.iconButton}
                                    onPress={skipTutorial}
                                >
                                    <Ionicons name="close" size={20} color={Colors.gray[500]} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Barra de progreso */}
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${progress}%` }]} />
                        </View>

                        {/* Contenido */}
                        <View style={styles.content}>
                            <View style={styles.contentIcon}>
                                <Ionicons name={getStepIcon()} size={28} color={Colors.emerald[600]} />
                            </View>
                            <View style={styles.contentText}>
                                <Text style={styles.contentTitle}>{currentStepData.title}</Text>
                                <Text style={styles.contentDescription}>{currentStepData.description}</Text>
                            </View>
                        </View>

                        {/* Acciones */}
                        <View style={styles.actions}>
                            {currentStepData.waitForAction ? (
                                <View style={styles.waitingContainer}>
                                    <View style={styles.waitingBadge}>
                                        <Ionicons name="hourglass-outline" size={16} color={Colors.orange[500]} />
                                        <Text style={styles.waitingText}>Realiza la acción indicada</Text>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.nextButton}
                                    onPress={handleNext}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.nextText}>
                                        {currentStep === steps.length - 1 ? '¡Finalizar!' : 'Siguiente'}
                                    </Text>
                                    <Ionicons 
                                        name={currentStep === steps.length - 1 ? 'checkmark' : 'arrow-forward'} 
                                        size={18} 
                                        color="#fff" 
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Skip */}
                        <TouchableOpacity 
                            style={styles.skipButton}
                            onPress={skipTutorial}
                        >
                            <Text style={styles.skipText}>Saltar tutorial</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    highlightContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 998,
    },
    highlight: {
        position: 'absolute',
        borderRadius: BorderRadius.xl,
        borderWidth: 3,
        borderColor: Colors.emerald[400],
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        shadowColor: Colors.emerald[400],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
    },
    floatingOverlay: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 100 : 80,
        left: Spacing.md,
        right: Spacing.md,
        backgroundColor: '#fff',
        borderRadius: BorderRadius.xxl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 15,
        zIndex: 999,
    },
    // Vista minimizada
    minimizedView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    minimizedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    minimizedIconBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.emerald[600],
        justifyContent: 'center',
        alignItems: 'center',
    },
    minimizedText: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: Colors.gray[800],
    },
    minimizedStep: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.emerald[600],
        backgroundColor: Colors.emerald[50],
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    // Vista expandida
    expandedView: {
        padding: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    stepBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.emerald[600],
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepBadgeText: {
        color: '#fff',
        fontSize: FontSizes.sm,
        fontWeight: '700',
    },
    headerTitle: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: Colors.gray[800],
    },
    headerActions: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    iconButton: {
        padding: Spacing.xs,
    },
    progressContainer: {
        height: 4,
        backgroundColor: Colors.gray[100],
        borderRadius: 2,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.emerald[500],
        borderRadius: 2,
    },
    content: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    contentIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.emerald[50],
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentText: {
        flex: 1,
    },
    contentTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.gray[900],
        marginBottom: 4,
    },
    contentDescription: {
        fontSize: FontSizes.sm,
        color: Colors.gray[600],
        lineHeight: 20,
    },
    actions: {
        marginBottom: Spacing.sm,
    },
    nextButton: {
        backgroundColor: Colors.emerald[600],
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
        shadowColor: Colors.emerald[600],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    nextText: {
        color: '#fff',
        fontSize: FontSizes.base,
        fontWeight: '700',
    },
    waitingContainer: {
        alignItems: 'center',
    },
    waitingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.orange[50],
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.orange[200],
    },
    waitingText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.orange[700],
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    skipText: {
        fontSize: FontSizes.sm,
        color: Colors.gray[400],
        textDecorationLine: 'underline',
    },
});
