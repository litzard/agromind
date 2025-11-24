import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa email y contraseña');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="leaf" size={48} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>AgroMind</Text>
                </View>

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

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={Colors.gray[400]} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.forgotPasswordContainer}>
                        <Link href="/forgot-password" asChild>
                            <TouchableOpacity>
                                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    <Button
                        title="Iniciar Sesión"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginButton}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                        <Link href="/register" asChild>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Regístrate aquí</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
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
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.gray[900],
    },
    subtitle: {
        fontSize: FontSizes.lg,
        color: Colors.gray[500],
        marginTop: Spacing.xs,
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
    loginButton: {
        marginTop: Spacing.xs,
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
    },
    forgotPasswordText: {
        color: Colors.primary,
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.lg,
    },
    footerText: {
        color: Colors.gray[600],
        fontSize: FontSizes.base,
    },
    linkText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: FontSizes.base,
    },
});
