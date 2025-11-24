import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';

const { width } = Dimensions.get('window');

interface WelcomeModalProps {
    visible: boolean;
    userName: string;
    onStartTutorial: () => void;
    onSkip: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
    visible,
    userName,
    onStartTutorial,
    onSkip,
}) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <Animated.View
                    style={[
                        styles.modal,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    {/* Decoración superior */}
                    <View style={styles.decorationTop}>
                        <View style={styles.plantIcon}>
                            <Ionicons name="leaf" size={60} color={Colors.emerald[600]} />
                        </View>
                    </View>

                    {/* Contenido */}
                    <View style={styles.content}>
                        <Text style={styles.greeting}>¡Bienvenido{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋</Text>
                        <Text style={styles.title}>Tu Sistema de Riego Inteligente está Listo</Text>
                        <Text style={styles.description}>
                            AgroMind te ayudará a cuidar tus plantas automáticamente. 
                            ¿Quieres que te muestre cómo funciona?
                        </Text>

                        {/* Features */}
                        <View style={styles.features}>
                            <View style={styles.feature}>
                                <View style={[styles.featureIcon, { backgroundColor: Colors.blue[50] }]}>
                                    <Ionicons name="water" size={20} color={Colors.blue[600]} />
                                </View>
                                <Text style={styles.featureText}>Riego automático basado en sensores</Text>
                            </View>
                            <View style={styles.feature}>
                                <View style={[styles.featureIcon, { backgroundColor: Colors.emerald[50] }]}>
                                    <Ionicons name="cloud" size={20} color={Colors.emerald[600]} />
                                </View>
                                <Text style={styles.featureText}>Integración con pronóstico del clima</Text>
                            </View>
                            <View style={styles.feature}>
                                <View style={[styles.featureIcon, { backgroundColor: Colors.orange[50] }]}>
                                    <Ionicons name="analytics" size={20} color={Colors.orange[500]} />
                                </View>
                                <Text style={styles.featureText}>Monitoreo en tiempo real</Text>
                            </View>
                        </View>
                    </View>

                    {/* Botones */}
                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={onStartTutorial}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="school" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>Comenzar Tutorial</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={onSkip}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>Explorar por mi cuenta</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.xxl,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
        overflow: 'hidden',
    },
    decorationTop: {
        backgroundColor: Colors.emerald[50],
        paddingVertical: Spacing.xl,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: Colors.emerald[100],
    },
    plantIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.emerald[600],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    content: {
        padding: Spacing.xl,
    },
    greeting: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.emerald[600],
        marginBottom: Spacing.xs,
    },
    title: {
        fontSize: FontSizes.xxl,
        fontWeight: '800',
        color: Colors.gray[900],
        marginBottom: Spacing.md,
        lineHeight: 30,
    },
    description: {
        fontSize: FontSizes.base,
        color: Colors.gray[600],
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    features: {
        gap: Spacing.md,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        flex: 1,
        fontSize: FontSizes.sm,
        color: Colors.gray[700],
        fontWeight: '500',
    },
    buttons: {
        padding: Spacing.xl,
        paddingTop: 0,
        gap: Spacing.md,
    },
    primaryButton: {
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
    primaryButtonText: {
        color: '#fff',
        fontSize: FontSizes.base,
        fontWeight: '700',
    },
    secondaryButton: {
        padding: Spacing.md,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: Colors.gray[500],
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
});
