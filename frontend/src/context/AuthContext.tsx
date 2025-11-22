import React, { createContext, useContext, useState } from 'react';
import { authApi } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  notifications: Notification[];
  addNotification: (title: string, message: string, type?: 'info' | 'warning' | 'error') => void;
  clearNotifications: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('agromind_user') || sessionStorage.getItem('agromind_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const userData = await authApi.login(email, password);
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('agromind_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('agromind_user', JSON.stringify(userData));
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const userData = await authApi.register({ email, password, name });
    setUser(userData);
    localStorage.setItem('agromind_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agromind_user');
    sessionStorage.removeItem('agromind_user');
  };

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const newNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, notifications, addNotification, clearNotifications }}>
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
