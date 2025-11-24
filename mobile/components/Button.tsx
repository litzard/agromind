import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../styles/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}) => {
    const getBackgroundColor = () => {
        if (disabled) return Colors.gray[300];
        switch (variant) {
            case 'secondary': return Colors.secondary;
            case 'outline': return 'transparent';
            case 'danger': return Colors.error;
            default: return Colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return Colors.gray[500];
        switch (variant) {
            case 'outline': return Colors.primary;
            default: return '#FFFFFF';
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return disabled ? Colors.gray[300] : Colors.primary;
        return 'transparent';
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outline' ? 1 : 0,
                },
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, { color: getTextColor(), marginLeft: icon ? Spacing.sm : 0 }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 48,
        borderRadius: BorderRadius.lg,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    text: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
});
