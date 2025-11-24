import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../styles/theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated' }) => {
    const getStyle = () => {
        switch (variant) {
            case 'outlined':
                return styles.outlined;
            case 'flat':
                return styles.flat;
            default:
                return styles.elevated;
        }
    };

    return (
        <View style={[styles.card, getStyle(), style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xxl, // More rounded
        padding: Spacing.xl,
    },
    elevated: {
        // Subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    outlined: {
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    flat: {
        backgroundColor: Colors.gray[50],
    },
});
