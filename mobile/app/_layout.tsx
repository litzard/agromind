import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { TutorialProvider } from '../context/TutorialContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Colors } from '../styles/theme';

const MainLayout = () => {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'forgot-password';

        if (!user && !inAuthGroup) {
            // Redirect to login if not authenticated and not in an auth screen
            router.replace('/login');
        } else if (user && inAuthGroup) {
            // Redirect to tabs if authenticated and trying to access auth screens
            router.replace('/(tabs)');
        }
    }, [user, isLoading, segments]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.gray[50] }}>
                <ActivityIndicator size="large" color={Colors.emerald[600]} />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add-zone" options={{ presentation: 'modal' }} />
            <Stack.Screen name="profile" />
        </Stack>
    );
};

export default function RootLayout() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <TutorialProvider>
                    <StatusBar style="dark" />
                    <MainLayout />
                </TutorialProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
