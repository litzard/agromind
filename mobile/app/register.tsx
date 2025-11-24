import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            await register(name, email, password);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="person-add" size={40} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>Crear Cuenta</Text>
                    <Text style={styles.subtitle}>Únete a AgroMind</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color={Colors.gray[400]} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre Completo"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    </View>

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

                    <Button
                        title="Registrarse"
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.registerButton}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                        <Link href="/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Inicia Sesión</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flexGrow: 1,
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
        fontSize: 28,
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
    registerButton: {
        marginTop: Spacing.md,
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
