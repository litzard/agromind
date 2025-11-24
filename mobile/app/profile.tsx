import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../styles/theme';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { isDark, toggleTheme, colors } = useTheme();
    const [profileImage, setProfileImage] = useState<string | null>(null);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const pickImage = async () => {
        // Solicitar permisos
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert(
                'Permiso requerido',
                'Necesitamos acceso a tu galería para cambiar la foto de perfil',
                [{ text: 'OK' }]
            );
            return;
        }

        // Abrir selector de imágenes
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setProfileImage(result.assets[0].uri);
            // Aquí podrías guardar la imagen en el servidor o AsyncStorage
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert(
                'Permiso requerido',
                'Necesitamos acceso a tu cámara para tomar una foto',
                [{ text: 'OK' }]
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            'Foto de perfil',
            'Selecciona una opción',
            [
                { text: 'Tomar foto', onPress: takePhoto },
                { text: 'Elegir de galería', onPress: pickImage },
                { text: 'Cancelar', style: 'cancel' }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Header />
            
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Botón de regreso */}
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.gray[700]} />
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>

                {/* Título */}
                <Text style={[styles.title, { color: colors.text }]}>Mi Perfil</Text>

                {/* Sección de foto de perfil */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Foto de Perfil</Text>
                    <View style={[styles.profileImageContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity 
                            style={styles.avatarContainer}
                            onPress={showImageOptions}
                        >
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {user?.name ? getInitials(user.name) : 'U'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.avatarEditBadge}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Usuario'}</Text>
                            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
                            <TouchableOpacity 
                                style={styles.changePhotoButton}
                                onPress={showImageOptions}
                            >
                                <Text style={styles.changePhotoText}>Cambiar foto</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Sección de apariencia */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Apariencia</Text>
                    <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.settingLeft}>
                            <Ionicons 
                                name={isDark ? "moon" : "sunny"} 
                                size={24} 
                                color={isDark ? "#60A5FA" : "#FBBF24"} 
                            />
                            <View style={styles.settingTextContainer}>
                                <Text style={[styles.settingLabel, { color: colors.text }]}>Modo Oscuro</Text>
                                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                                    {isDark ? 'Activado' : 'Desactivado'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: Colors.gray[300], true: Colors.emerald[500] }}
                            thumbColor={isDark ? Colors.emerald[600] : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Sección de información de cuenta */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Información de Cuenta</Text>
                    
                    <View style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Nombre</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>{user?.name || 'No disponible'}</Text>
                    </View>

                    <View style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Correo electrónico</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email || 'No disponible'}</Text>
                    </View>

                    <View style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ID de Usuario</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>{user?.id || 'No disponible'}</Text>
                    </View>
                </View>

                {/* Botones de acción */}
                <View style={styles.section}>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="key-outline" size={20} color={colors.primary} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Cambiar contraseña</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Preferencias de notificaciones</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.gray[50],
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    backText: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        color: Colors.gray[700],
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.gray[900],
        marginBottom: Spacing.xl,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
        color: Colors.gray[500],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.md,
    },
    profileImageContainer: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: Colors.emerald[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.emerald[600],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
        color: Colors.gray[900],
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: FontSizes.sm,
        color: Colors.gray[600],
        marginBottom: Spacing.md,
    },
    changePhotoButton: {
        alignSelf: 'flex-start',
    },
    changePhotoText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.emerald[600],
    },
    settingItem: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        color: Colors.gray[900],
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: FontSizes.sm,
        color: Colors.gray[600],
    },
    infoItem: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoLabel: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
        color: Colors.gray[500],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        color: Colors.gray[900],
    },
    actionButton: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionButtonText: {
        flex: 1,
        fontSize: FontSizes.base,
        fontWeight: '600',
        color: Colors.gray[900],
    },
});
