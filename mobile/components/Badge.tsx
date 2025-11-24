import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../styles/theme';

interface BadgeProps {
    type: 'Outdoor' | 'Indoor' | 'Greenhouse' | 'Orchard';
}

export const Badge: React.FC<BadgeProps> = ({ type }) => {
    const getStyle = () => {
        switch (type) {
            case 'Outdoor':
                return { bg: Colors.blue[50], text: Colors.blue[600], icon: '🌳' };
            case 'Indoor':
                return { bg: Colors.purple[50], text: Colors.purple[600], icon: '🏠' };
            case 'Greenhouse':
                return { bg: Colors.emerald[50], text: Colors.emerald[600], icon: '🌿' };
            case 'Orchard':
                return { bg: Colors.orange[400] + '20', text: Colors.orange[400], icon: '🍎' }; // Adding transparency manually
            default:
                return { bg: Colors.gray[100], text: Colors.gray[600], icon: '📍' };
        }
    };

    const style = getStyle();

    return (
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
            <Text style={styles.icon}>{style.icon}</Text>
            <Text style={[styles.text, { color: style.text }]}>{type}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    icon: {
        fontSize: 12,
        marginRight: 4,
    },
    text: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
});
