import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Modal,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTutorial } from '../context/TutorialContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';

const { width, height } = Dimensions.get('window');

interface TutorialOverlayProps {
    targetPosition?: { x: number; y: number; width: number; height: number };
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ targetPosition }) => {
    const { isActive, currentStep, steps, nextStep, skipTutorial, currentScreen } = useTutorial();
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isActive) {
            // Animación de entrada
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

            // Animación de pulso continuo si hay target
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

    if (!isActive || !steps[currentStep]) return null;

    const currentStepData = steps[currentStep];
    
    // Solo mostrar si estamos en la pantalla correcta
    if (currentStepData.screen !== currentScreen) return null;

    const handleNext = () => {
        // Si el paso requiere navegación, navegar antes de continuar
        if (currentStepData.nextScreen) {
            router.push(currentStepData.nextScreen as any);
        }
        nextStep();
    };

    return (
        <>
            {/* Highlight del elemento target (sin overlay oscuro) */}
            {targetPosition && (
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

            {/* Barra flotante en la parte inferior */}
            <Animated.View
                style={[
                    styles.tutorialBar,
                    {
                        opacity: fadeAnim,
                        transform: [{ 
                            translateY: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [100, 0]
                            })
                        }],
                    },
                ]}
            >
                {/* Header compacto */}
                <View style={styles.barHeader}>
                    <View style={styles.barIconContainer}>
                        <Ionicons 
                            name={
                                currentStepData.actionType === 'tap-button' ? 'hand-left' :
                                currentStepData.actionType === 'navigate' ? 'arrow-forward' :
                                currentStepData.actionType === 'create-zone' ? 'checkmark-circle' :
                                'information-circle'
                            } 
                            size={24} 
                            color={Colors.emerald[600]} 
                        />
                    </View>
                    <View style={styles.barContent}>
                        <Text style={styles.barTitle}>{currentStepData.title}</Text>
                        <Text style={styles.barDescription} numberOfLines={2}>{currentStepData.description}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={skipTutorial}
                    >
                        <Ionicons name="close" size={20} color={Colors.gray[400]} />
                    </TouchableOpacity>
                </View>

                {/* Footer con botones */}
                <View style={styles.barFooter}>
                        {/* Indicadores de progreso */}
                        <View style={styles.indicators}>
                            {steps.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.indicator,
                                        index === currentStep && styles.indicatorActive,
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Botón siguiente */}
                        {currentStepData.waitForAction ? (
                            <View style={styles.waitingContainer}>
                                <View style={styles.waitingBadge}>
                                    <Ionicons name="hourglass-outline" size={16} color={Colors.orange[500]} />
                                    <Text style={styles.waitingText}>Completa la acción para continuar</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.skipWaitButton}
                                    onPress={() => skipTutorial()}
                                >
                                    <Text style={styles.skipWaitText}>Saltar Tutorial</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.nextButton}
                                onPress={handleNext}
                            >
                                <Text style={styles.nextText}>
                                    {currentStep === steps.length - 1 ? '¡Finalizar!' : 'Siguiente'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>

                {/* Step counter */}
                <Text style={styles.stepCounter}>
                    Paso {currentStep + 1} de {steps.length}
                </Text>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    highlightContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    highlight: {
        position: 'absolute',
        borderRadius: BorderRadius.xl,
        borderWidth: 3,
        borderColor: Colors.emerald[400],
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        shadowColor: Colors.emerald[400],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
    },
    tutorialBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
        paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
        zIndex: 1000,
    },
    barHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.lg,
        gap: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    barIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.emerald[50],
        justifyContent: 'center',
        alignItems: 'center',
    },
    barContent: {
        flex: 1,
    },
    barTitle: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: Colors.gray[900],
        marginBottom: 4,
    },
    barDescription: {
        fontSize: FontSizes.sm,
        color: Colors.gray[600],
        lineHeight: 18,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    barFooter: {
        padding: Spacing.lg,
        paddingTop: Spacing.md,
        gap: Spacing.md,
    },
    indicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        marginBottom: Spacing.sm,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.gray[200],
    },
    indicatorActive: {
        backgroundColor: Colors.emerald[600],
        width: 20,
    },
    nextButton: {
        backgroundColor: Colors.emerald[600],
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
        shadowColor: Colors.emerald[600],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    waitingContainer: {
        gap: Spacing.md,
    },
    waitingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.orange[50],
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.orange[200],
    },
    waitingText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.orange[700],
    },
    skipWaitButton: {
        padding: Spacing.sm,
        alignItems: 'center',
    },
    skipWaitText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.gray[500],
        textDecorationLine: 'underline',
    },
    nextText: {
        color: '#fff',
        fontSize: FontSizes.base,
        fontWeight: '700',
    },
    stepCounter: {
        textAlign: 'center',
        fontSize: 11,
        color: Colors.gray[400],
        fontWeight: '600',
    },
});
