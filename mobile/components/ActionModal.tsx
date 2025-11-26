import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

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
}

export const ActionModal: React.FC<ActionModalProps> = ({
    visible,
    title,
    message,
    onClose,
    buttons,
    icon = 'information-circle',
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconWrapper}>
                        <Ionicons name={icon} size={28} color={Colors.emerald[600]} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    <View style={styles.buttonGroup}>
                        {buttons.map((button, index) => (
                            <TouchableOpacity
                                key={`${button.label}-${index}`}
                                style={[
                                    styles.button,
                                    button.variant === 'primary' && styles.buttonPrimary,
                                    button.variant === 'destructive' && styles.buttonDestructive,
                                ]}
                                onPress={button.onPress}
                                activeOpacity={0.8}
                            >
                                {button.icon ? (
                                    <Ionicons
                                        name={button.icon}
                                        size={18}
                                        color={button.variant === 'primary' ? '#fff' : Colors.gray[700]}
                                        style={{ marginRight: 6 }}
                                    />
                                ) : null}
                                <Text
                                    style={[
                                        styles.buttonText,
                                        button.variant === 'primary' && styles.buttonTextPrimary,
                                    ]}
                                >
                                    {button.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 25,
        elevation: 10,
    },
    iconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.emerald[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.gray[900],
        textAlign: 'center',
    },
    message: {
        color: Colors.gray[600],
        textAlign: 'center',
        marginTop: Spacing.sm,
        lineHeight: 22,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
        width: '100%',
    },
    button: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: Colors.emerald[600],
        borderColor: Colors.emerald[600],
    },
    buttonDestructive: {
        borderColor: Colors.red[500],
        backgroundColor: Colors.red[50],
    },
    buttonText: {
        fontWeight: '600',
        color: Colors.gray[700],
    },
    buttonTextPrimary: {
        color: '#fff',
    },
});

export default ActionModal;
