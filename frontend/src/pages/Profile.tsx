import React, { useState } from 'react';
import { Lock, ArrowLeft, Check, AlertCircle, Moon, ChevronRight, LogOut, User, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/api';
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';

const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const updatedUser = await authApi.updateProfile(user.id, { name, email });
      updateUser(updatedUser);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al actualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      await authApi.changePassword(user.id, currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Contraseña cambiada correctamente' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
        <Link 
          to="/dashboard"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Administra tu información personal y preferencias</p>
        </div>
      </div>

      {/* Layout de 2 columnas en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna izquierda - Perfil y Avatar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card de Avatar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              {/* Avatar grande */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-100 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">✎</span>
                </button>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user?.name || 'Usuario'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <span className="mt-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full">
                Usuario Activo
              </span>
            </div>
          </div>

          {/* Preferencias rápidas */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Preferencias</h3>
            </div>
            
            {/* Modo Oscuro Toggle */}
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <Moon size={18} className="text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Modo Oscuro</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {darkMode ? 'Activado' : 'Desactivado'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${
                  darkMode ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

          </div>

          {/* Cerrar Sesión */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-500 py-3 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>

        {/* Columna derecha - Formularios */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Información de la Cuenta */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <User size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Información Personal</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Actualiza tu nombre y correo electrónico</p>
              </div>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                      placeholder="Tu nombre"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div className={`flex items-center gap-2 p-3 rounded-xl ${
                  message.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' 
                    : 'bg-red-50 dark:bg-red-900/30 text-red-600'
                }`}>
                  {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>

          {/* Seguridad - Cambiar Contraseña */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                  <Lock size={18} className="text-orange-500" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Seguridad</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cambiar contraseña de acceso</p>
                </div>
              </div>
              <ChevronRight size={18} className={`text-gray-400 transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
            </button>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="p-6 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {passwordMessage && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${
                    passwordMessage.type === 'success' 
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' 
                      : 'bg-red-50 dark:bg-red-900/30 text-red-600'
                  }`}>
                    {passwordMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span className="text-sm font-medium">{passwordMessage.text}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
                  >
                    {passwordLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Profile;
