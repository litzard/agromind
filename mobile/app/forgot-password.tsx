import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '../components/Button';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (!email) return;
        // Mock API call
        console.log('Sending recovery email to:', email);
        setSubmitted(true);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="key-outline" size={40} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>Recuperar Contraseña</Text>
                    <Text style={styles.subtitle}>
                        {submitted
                            ? '¡Correo enviado!'
                            : 'Te enviaremos un enlace para restablecerla'}
                    </Text>
                </View>

                {!submitted ? (
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={Colors.gray[400]} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <Button
                            title="Enviar Enlace"
                            onPress={handleSubmit}
                            style={styles.submitButton}
                            icon={<Ionicons name="arrow-forward" size={20} color="#fff" />}
                        />
                    </View>
                ) : (
                    <View style={styles.successContainer}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
                        </View>
                        <Text style={styles.successText}>
                            Si existe una cuenta asociada a {email}, recibirás las instrucciones en breve.
                        </Text>
                    </View>
                )}

                <View style={styles.footer}>
                    <Link href="/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Volver al inicio de sesión</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.emerald[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.gray[900],
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FontSizes.base,
        color: Colors.gray[500],
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    form: {
        gap: Spacing.lg,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        height: 56,
        backgroundColor: Colors.gray[50],
    },
    inputIcon: {
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: FontSizes.base,
        color: Colors.gray[900],
    },
    submitButton: {
        marginTop: Spacing.md,
    },
    successContainer: {
        alignItems: 'center',
        padding: Spacing.lg,
    },
    successIcon: {
        marginBottom: Spacing.md,
    },
    successText: {
        textAlign: 'center',
        color: Colors.gray[600],
        fontSize: FontSizes.base,
        lineHeight: 24,
    },
    footer: {
        marginTop: Spacing.xxl,
        alignItems: 'center',
    },
    linkText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: FontSizes.base,
    },
});
