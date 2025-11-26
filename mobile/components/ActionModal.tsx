import React, { useEffect, useRef } from 'react';
import { 
    Modal, 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Animated,
    ScrollView,
    Dimensions 
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ActionModalButton = {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'destructive';
    icon?: keyof typeof Ionicons.glyphMap;
};

interface ActionModalProps {
    visible: boolean;
    title: string;
    message?: string;
    onClose?: () => void;
    buttons: ActionModalButton[];
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
}

export const ActionModal: React.FC<ActionModalProps> = ({
    visible,
    title,
    message,
    onClose,
    buttons,
    icon = 'information-circle',
    iconColor,
}) => {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 65,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.9);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const getIconColor = () => {
        if (iconColor) return iconColor;
        if (icon === 'alert-circle' || icon === 'warning') return Colors.orange[500];
        if (icon === 'checkmark-circle') return Colors.emerald[600];
        if (icon === 'close-circle') return Colors.red[500];
        return Colors.emerald[600];
    };

    const getIconBgColor = () => {
        const color = getIconColor();
        if (color === Colors.orange[500]) return Colors.orange[50];
        if (color === Colors.red[500]) return Colors.red[50];
        return Colors.emerald[50];
    };

    // Determinar si los botones van en columna o fila
    const useColumnLayout = buttons.length > 2;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <Animated.View 
                    style={[
                        styles.card,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    {/* Header con ícono */}
                    <View style={[styles.iconWrapper, { backgroundColor: getIconBgColor() }]}>
                        <Ionicons name={icon} size={32} color={getIconColor()} />
                    </View>

                    {/* Título */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Mensaje */}
                    {message ? (
                        <ScrollView 
                            style={styles.messageScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.message}>{message}</Text>
                        </ScrollView>
                    ) : null}

                    {/* Botones */}
                    <View style={[
                        styles.buttonGroup,
                        useColumnLayout && styles.buttonGroupColumn
                    ]}>
                        {buttons.map((button, index) => (
                            <TouchableOpacity
                                key={`${button.label}-${index}`}
                                style={[
                                    styles.button,
                                    useColumnLayout && styles.buttonFullWidth,
                                    button.variant === 'primary' && styles.buttonPrimary,
                                    button.variant === 'destructive' && styles.buttonDestructive,
                                    !button.variant && styles.buttonSecondary,
                                ]}
                                onPress={button.onPress}
                                activeOpacity={0.8}
                            >
                                {button.icon ? (
                                    <Ionicons
                                        name={button.icon}
                                        size={18}
                                        color={button.variant === 'primary' ? '#fff' : Colors.gray[600]}
                                        style={{ marginRight: 8 }}
                                    />
                                ) : null}
                                <Text
                                    style={[
                                        styles.buttonText,
                                        button.variant === 'primary' && styles.buttonTextPrimary,
                                        button.variant === 'destructive' && styles.buttonTextDestructive,
                                    ]}
                                >
                                    {button.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#fff',
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 20 },
        shadowRadius: 40,
        elevation: 20,
    },
    iconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '800',
        color: Colors.gray[900],
        textAlign: 'center',
        marginBottom: Spacing.sm,
        letterSpacing: -0.3,
    },
    messageScroll: {
        maxHeight: 200,
        width: '100%',
    },
    message: {
        fontSize: FontSizes.base,
        color: Colors.gray[600],
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
        width: '100%',
    },
    buttonGroupColumn: {
        flexDirection: 'column',
        gap: Spacing.sm,
    },
    button: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md + 2,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 50,
    },
    buttonFullWidth: {
        flex: 0,
        width: '100%',
    },
    buttonPrimary: {
        backgroundColor: Colors.emerald[600],
        shadowColor: Colors.emerald[600],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonSecondary: {
        backgroundColor: Colors.gray[100],
        borderWidth: 0,
    },
    buttonDestructive: {
        backgroundColor: Colors.red[50],
        borderWidth: 1,
        borderColor: Colors.red[100],
    },
    buttonText: {
        fontSize: FontSizes.base,
        fontWeight: '700',
        color: Colors.gray[700],
    },
    buttonTextPrimary: {
        color: '#fff',
    },
    buttonTextDestructive: {
        color: Colors.red[600],
    },
});

export default ActionModal;
