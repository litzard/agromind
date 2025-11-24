import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    colors: {
        background: string;
        card: string;
        text: string;
        textSecondary: string;
        border: string;
        primary: string;
    };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightColors = {
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    primary: '#10B981',
};

const darkColors = {
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    primary: '#34D399',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    // Cargar preferencia guardada
    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme !== null) {
                setIsDark(savedTheme === 'dark');
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newTheme = !isDark;
            setIsDark(newTheme);
            await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
