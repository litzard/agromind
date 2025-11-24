import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../types';
import { API_CONFIG } from '../constants/api';
import { Alert } from 'react-native';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const storedToken = await AsyncStorage.getItem('token');

            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            }
        } catch (error) {
            console.error('Error loading auth data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            // Backend returns User object directly, no token
            const user: User = data;
            const token = 'dummy-token'; // Backend doesn't use tokens yet

            setUser(user);
            setToken(token);

            await AsyncStorage.setItem('user', JSON.stringify(user));
            await AsyncStorage.setItem('token', token);
        } catch (error: any) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        console.log('Attempting register with:', { name, email, url: `${API_CONFIG.BASE_URL}/auth/register` });
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            console.log('Register response status:', response.status);
            const data = await response.json();
            console.log('Register response data:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Error al registrarse');
            }

            // Backend returns User object directly
            const user: User = data;
            const token = 'dummy-token';

            setUser(user);
            setToken(token);

            await AsyncStorage.setItem('user', JSON.stringify(user));
            await AsyncStorage.setItem('token', token);
            console.log('Register success, user saved');
        } catch (error: any) {
            console.error('Register error details:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
            setUser(null);
            setToken(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
