import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTutorial } from '../context/TutorialContext';
import { Button } from '../components/Button';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import { API_CONFIG } from '../constants/api';

export default function AddZoneScreen() {
    const [name, setName] = useState('');
    const [type, setType] = useState<'Outdoor' | 'Indoor' | 'Greenhouse'>('Outdoor');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { isActive, nextStep, setCurrentScreen } = useTutorial();
    const router = useRouter();

    useFocusEffect(
        React.useCallback(() => {
            setCurrentScreen('add-zone');
        }, [])
    );

    const handleCreateZone = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Por favor ingresa un nombre para la zona');
            return;
        }

        setLoading(true);
        try {
            const defaultSensors = {
                soilMoisture: 50,
                temperature: 25,
                humidity: 60,
                lightLevel: 80,
                tankLevel: 100
            };

            const defaultStatus = {
                pump: 'OFF',
                connection: 'ONLINE',
                lastWatered: 'Nunca'
            };

            const defaultConfig = {
                moistureThreshold: 30,
                wateringDuration: 10,
                autoMode: false,
                respectRainForecast: false,
                useWeatherApi: false
            };

            const response = await fetch(`${API_CONFIG.BASE_URL}/zones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    name,
                    type,
                    sensors: defaultSensors,
                    status: defaultStatus,
                    config: defaultConfig
                }),
            });

            if (response.ok) {
                // Si el tutorial está activo, avanzar al siguiente paso
                if (isActive) {
                    nextStep(); // Avanza automáticamente
                    router.back();
                } else {
                    Alert.alert('✅ Éxito', 'Zona creada correctamente', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                }
            } else {
                throw new Error('Error al crear la zona');
            }
        } catch (error) {
            console.error('Create zone error:', error);
            Alert.alert('Error', 'No se pudo crear la zona');
        } finally {
            setLoading(false);
        }
    };

    const ZoneTypeOption = ({ value, label, icon, color }: { value: typeof type, label: string, icon: any, color: string }) => (
        <TouchableOpacity
            style={[
                styles.typeOption,
                type === value && styles.typeOptionActive,
                { borderColor: type === value ? color : Colors.gray[200] }
            ]}
            onPress={() => setType(value)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: type === value ? color + '20' : Colors.gray[100] }]}>
                <Ionicons name={icon} size={24} color={type === value ? color : Colors.gray[500]} />
            </View>
            <Text style={[styles.typeLabel, type === value && { color: color, fontWeight: '700' }]}>{label}</Text>
            {type === value && (
                <View style={[styles.checkIcon, { backgroundColor: color }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.gray[700]} />
                </TouchableOpacity>
                <Text style={styles.title}>Nueva Zona</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.formSection}>
                    <Text style={styles.label}>Nombre de la Zona</Text>
                    <View 
                        style={styles.inputContainer}
                        // @ts-ignore
                        nativeID="zone-name-input"
                    >
                        <Ionicons name="pricetag-outline" size={20} color={Colors.gray[400]} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. Jardín Trasero"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={Colors.gray[400]}
                        />
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Tipo de Zona</Text>
                    <View 
                        style={styles.typesGrid}
                        // @ts-ignore
                        nativeID="zone-type-select"
                    >
                        <ZoneTypeOption
                            value="Outdoor"
                            label="Exterior"
                            icon="leaf"
                            color={Colors.emerald[600]}
                        />
                        <ZoneTypeOption
                            value="Indoor"
                            label="Interior"
                            icon="home"
                            color={Colors.blue[600]}
                        />
                        <ZoneTypeOption
                            value="Greenhouse"
                            label="Invernadero"
                            icon="flower"
                            color={Colors.orange[500]}
                        />
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={24} color={Colors.blue[500]} />
                    <Text style={styles.infoText}>
                        La zona se creará con una configuración predeterminada que podrás ajustar más tarde.
                    </Text>
                </View>

                <Button
                    title="Crear Zona"
                    onPress={handleCreateZone}
                    loading={loading}
                    style={styles.submitButton}
                    // @ts-ignore
                    nativeID="create-zone-button"
                />
            </ScrollView>
            <TutorialOverlay />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    backButton: {
        padding: Spacing.xs,
        marginRight: Spacing.md,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.gray[900],
    },
    content: {
        padding: Spacing.lg,
    },
    formSection: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        color: Colors.gray[700],
        marginBottom: Spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        height: 56,
    },
    inputIcon: {
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: FontSizes.base,
        color: Colors.gray[900],
    },
    typesGrid: {
        gap: Spacing.md,
    },
    typeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: Colors.gray[200],
    },
    typeOptionActive: {
        backgroundColor: '#fff',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    typeLabel: {
        flex: 1,
        fontSize: FontSizes.base,
        color: Colors.gray[600],
    },
    checkIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.blue[50],
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    infoText: {
        flex: 1,
        fontSize: FontSizes.sm,
        color: Colors.blue[800],
        lineHeight: 20,
    },
    submitButton: {
        marginTop: Spacing.sm,
    },
});
