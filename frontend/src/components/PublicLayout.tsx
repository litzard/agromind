import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Menu, X, Home, Bell, User, LogOut, Settings, ChevronDown, AlertTriangle, Droplets } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, notifications, clearNotifications, markNotificationRead } = useAuth();
  const { darkMode } = useTheme();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Características', href: '/features' },
    { name: 'Sobre Nosotros', href: '/about' },
    { name: 'Contacto', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`min-h-screen ${isAuthenticated && darkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b ${
        isAuthenticated && darkMode 
          ? 'bg-gray-900/80 border-gray-700' 
          : 'bg-white/80 border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className={`text-xl font-bold ${isAuthenticated && darkMode ? 'text-white' : 'text-gray-900'}`}>
                AgroMind
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : isAuthenticated && darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Side - Auth or CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Dashboard Link */}
                  <Link
                    to="/dashboard"
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                      darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Home size={18} />
                    Dashboard
                  </Link>

                  {/* Notifications */}
                  <div className="relative" ref={notificationsRef}>
                    <button 
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowUserMenu(false);
                      }}
                      className={`p-2.5 rounded-xl transition-all relative ${
                        darkMode
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {showNotifications && (
                      <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border overflow-hidden animate-fade-in z-50 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                      }`}>
                        <div className={`px-4 py-3 border-b flex justify-between items-center ${
                          darkMode ? 'border-gray-700' : 'border-gray-100'
                        }`}>
                          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notificaciones</h3>
                          {notifications && notifications.length > 0 && (
                            <button onClick={clearNotifications} className="text-xs text-emerald-600 hover:underline font-medium">
                              Limpiar todo
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {!notifications || notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <Bell size={32} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sin notificaciones</p>
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div 
                                key={notif.id} 
                                onClick={() => markNotificationRead(notif.id)}
                                className={`px-4 py-3 border-b last:border-0 cursor-pointer ${
                                  darkMode 
                                    ? `hover:bg-gray-700 border-gray-700 ${!notif.read ? 'bg-emerald-900/20' : ''}`
                                    : `hover:bg-gray-50 border-gray-50 ${!notif.read ? 'bg-emerald-50/50' : ''}`
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 p-2 rounded-xl ${
                                    notif.type === 'error' ? 'bg-red-100 text-red-600' 
                                    : notif.type === 'warning' ? 'bg-orange-100 text-orange-600'
                                    : 'bg-emerald-100 text-emerald-600'
                                  }`}>
                                    {notif.type === 'error' ? <AlertTriangle size={16} /> : <Droplets size={16} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{notif.title}</p>
                                    <p className={`text-xs mt-0.5 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notif.message}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Profile */}
                  <div className="relative" ref={userMenuRef}>
                    <button 
                      onClick={() => {
                        setShowUserMenu(!showUserMenu);
                        setShowNotifications(false);
                      }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                      </div>
                      <ChevronDown size={16} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''} ${
                        darkMode ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </button>

                    {showUserMenu && (
                      <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-xl border overflow-hidden animate-fade-in z-50 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                      }`}>
                        {/* Profile Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                              {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{user?.name}</p>
                              <p className="text-xs text-emerald-100 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Options */}
                        <div className="p-2">
                          <Link 
                            to="/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                              darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              darkMode ? 'bg-emerald-900/30' : 'bg-emerald-100'
                            }`}>
                              <Home size={16} className={darkMode ? 'text-emerald-400' : 'text-emerald-600'} />
                            </div>
                            <span>Dashboard</span>
                          </Link>
                          <Link 
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                              darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              darkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                            }`}>
                              <User size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                            </div>
                            <span>Mi Perfil</span>
                          </Link>
                          <Link 
                            to="/config"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                              darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              darkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                            }`}>
                              <Settings size={16} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                            </div>
                            <span>Configuración</span>
                          </Link>
                        </div>
                        
                        {/* Logout */}
                        <div className={`p-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <button 
                            onClick={() => { setShowUserMenu(false); logout(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                              darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              darkMode ? 'bg-red-900/30' : 'bg-red-100'
                            }`}>
                              <LogOut size={16} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                            </div>
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
                  >
                    Comenzar Gratis
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg ${
                isAuthenticated && darkMode
                  ? 'text-gray-400 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t py-4 px-4 animate-fade-in ${
            isAuthenticated && darkMode
              ? 'bg-gray-900 border-gray-700'
              : 'bg-white border-gray-100'
          }`}>
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : isAuthenticated && darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className={`mt-4 pt-4 border-t space-y-2 ${
              isAuthenticated && darkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-base font-semibold text-white bg-emerald-500 rounded-xl"
                  >
                    <Home size={18} />
                    Ir al Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-base font-medium rounded-xl ${
                      darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100'
                    }`}
                  >
                    <User size={18} />
                    Mi Perfil
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-base font-medium rounded-xl ${
                      darkMode ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-50'
                    }`}
                  >
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center text-base font-medium text-gray-700 bg-gray-100 rounded-xl"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center text-base font-semibold text-white bg-emerald-500 rounded-xl"
                  >
                    Comenzar Gratis
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">AgroMind</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Sistema inteligente de riego automatizado que cuida tus plantas con tecnología IoT y sensores avanzados.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors">Características</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">Sobre Nosotros</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contacto</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Términos</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} AgroMind. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
