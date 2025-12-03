import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import type { User, Notification } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: Notification[];
  addNotification: (title: string, message: string, type?: 'info' | 'warning' | 'error') => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key para localStorage basado en el usuario
const getNotificationsKey = (userId: number) => `agromind_notifications_${userId}`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Cargar usuario al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('agromind_user') || sessionStorage.getItem('agromind_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Cargar notificaciones del usuario
      loadNotifications(parsedUser.id);
    }
    setIsLoading(false);
  }, []);

  // Cargar notificaciones del usuario
  const loadNotifications = (userId: number) => {
    const stored = localStorage.getItem(getNotificationsKey(userId));
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      })));
    }
  };

  // Guardar notificaciones cuando cambien
  useEffect(() => {
    if (user) {
      localStorage.setItem(getNotificationsKey(user.id), JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const userData = await authApi.login(email, password);
    const userWithType: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email
    };
    setUser(userWithType);
    if (rememberMe) {
      localStorage.setItem('agromind_user', JSON.stringify(userWithType));
    } else {
      sessionStorage.setItem('agromind_user', JSON.stringify(userWithType));
    }
    loadNotifications(userWithType.id);
  };

  const register = async (email: string, password: string, name: string) => {
    const userData = await authApi.register({ email, password, name });
    const userWithType: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email
    };
    setUser(userWithType);
    localStorage.setItem('agromind_user', JSON.stringify(userWithType));
  };

  const logout = () => {
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('agromind_user');
    sessionStorage.removeItem('agromind_user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('agromind_user', JSON.stringify(updatedUser));
    sessionStorage.setItem('agromind_user', JSON.stringify(updatedUser));
  };

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Máximo 50 notificaciones
  };

  const clearNotifications = () => {
    setNotifications([]);
    if (user) {
      localStorage.removeItem(getNotificationsKey(user.id));
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      updateUser,
      isAuthenticated: !!user, 
      isLoading,
      notifications, 
      addNotification, 
      clearNotifications,
      markNotificationRead
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
