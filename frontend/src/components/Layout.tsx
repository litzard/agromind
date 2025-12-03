import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Leaf, Bell, User, LogOut, AlertTriangle, Droplets, ChevronDown, Menu, X, Activity, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, user, logout, notifications, clearNotifications, markNotificationRead } = useAuth();
  const { darkMode } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const sidebarNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Estadísticas', href: '/statistics', icon: Activity },
    { name: 'Horarios', href: '/schedules', icon: Clock },
  ];

  const publicNavigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Sobre Nosotros', href: '/about' },
  ];

  const isDashboardSection = ['/dashboard', '/statistics', '/schedules', '/profile'].includes(location.pathname);
  const isPublicPage = ['/', '/about'].includes(location.pathname);
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
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar - Only visible on dashboard sections */}
      {isDashboardSection && (
        <div className="hidden md:flex md:w-64 md:flex-col fixed h-full z-30 pt-16">
          <div className="flex flex-col grow pt-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-r border-white/30 dark:border-gray-700/50 overflow-y-auto">
            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
              {sidebarNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 transition-colors ${
                        isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      }`}
                    />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
            
            {/* Status */}
            <div className="mx-4 mb-6 px-4 py-3 bg-emerald-100/60 dark:bg-emerald-900/40 backdrop-blur-sm rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Sistema conectado</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b ${
        darkMode 
          ? 'bg-gray-900/70 border-white/10' 
          : 'bg-white/70 border-white/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>AgroMind</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {publicNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
              
              {/* Dashboard Link */}
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isDashboardSection
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : darkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Home size={16} />
                Dashboard
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
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
                      <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border overflow-hidden animate-fade-in z-50 backdrop-blur-xl ${
                        darkMode ? 'bg-gray-800/90 border-white/10' : 'bg-white/90 border-white/50'
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
                      <ChevronDown size={16} className={`transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''} ${
                        darkMode ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </button>

                    {showUserMenu && (
                      <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border overflow-hidden animate-fade-in z-50 backdrop-blur-xl ${
                        darkMode ? 'bg-gray-800/90 border-white/10' : 'bg-white/90 border-white/50'
                      }`}>
                        {/* Profile Header with Gradient */}
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
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                              darkMode ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              darkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                            }`}>
                              <User size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                            </div>
                            <span>Mi Perfil</span>
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
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    to="/login"
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
                  >
                    Comenzar Gratis
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg ${
                  darkMode
                    ? 'text-gray-400 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t py-4 px-4 animate-fade-in backdrop-blur-xl ${
            darkMode
              ? 'bg-gray-900/90 border-white/10'
              : 'bg-white/90 border-white/30'
          }`}>
            <div className="space-y-1 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">Páginas</p>
              {publicNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'text-emerald-600 bg-emerald-100/80 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : darkMode
                        ? 'text-gray-300 hover:bg-white/10'
                        : 'text-gray-600 hover:bg-black/5'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            {isAuthenticated ? (
              <div className="space-y-1 pt-4 border-t border-gray-100/50 dark:border-gray-700/50">
                <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">Dashboard</p>
                {sidebarNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'text-emerald-600 bg-emerald-100/80 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : darkMode
                          ? 'text-gray-300 hover:bg-white/10'
                          : 'text-gray-600 hover:bg-black/5'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 text-base font-medium rounded-xl ${
                      darkMode ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-50'
                    }`}
                  >
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full px-4 py-3 text-center text-base font-medium rounded-xl ${
                    darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100'
                  }`}
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
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Main content */}
      <div className="pt-16">
        <main className={`min-h-[calc(100vh-4rem)] ${isDashboardSection ? 'md:pl-64' : ''}`}>
          <div className={isDashboardSection ? 'py-6' : ''}>
            <div className={isDashboardSection ? 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8' : ''}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer - Only on public pages */}
      {isPublicPage && (
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
                  <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">Sobre Nosotros</Link></li>
                  <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Registrarse</Link></li>
                  <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Iniciar Sesión</Link></li>
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
      )}
    </div>
  );
};

export default Layout;
