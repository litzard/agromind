import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, History, Sprout, Bell, User, LogOut, AlertTriangle, Droplets } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout, notifications, clearNotifications } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Configuración', href: '/config', icon: Settings },
    { name: 'Historial', href: '/history', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex md:w-64 md:flex-col fixed h-full z-30">
        <div className="flex flex-col grow pt-5 bg-white dark:bg-gray-800 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center shrink-0 px-4 mb-8">
            <Sprout className="h-8 w-8 text-green-600 mr-2" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">AgroMind</span>
          </div>
          <div className="grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-r-4 border-green-600'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
                      } mr-3 shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Top Header (Desktop & Mobile) */}
      <div className="fixed top-0 left-0 md:left-64 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo (Mobile) */}
          <div className="flex items-center md:hidden">
            <Sprout className="h-6 w-6 text-green-600 mr-2" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">AgroMind</span>
          </div>
          
          {/* Spacer (Desktop) */}
          <div className="hidden md:block"></div>

          {/* User Menu & Notifications */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-800 bg-red-500 transform translate-x-1/4 -translate-y-1/4"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in-up">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-gray-800 dark:text-white">Notificaciones</h3>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} className="text-xs text-green-600 hover:text-green-700 font-medium">
                        Limpiar todo
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        No hay notificaciones nuevas
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 p-1.5 rounded-full ${notif.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                              {notif.type === 'error' ? <AlertTriangle size={12} /> : <Droplets size={12} />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{notif.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.timestamp).toLocaleTimeString()}</p>
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
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-linear-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                </div>
                <span className="text-xs font-medium text-gray-800 dark:text-white hidden sm:block">{user?.name || 'Usuario'}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in-up">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                      <User size={16} /> Mi Perfil
                    </button>
                    <button 
                      onClick={logout}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium"
                    >
                      <LogOut size={16} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation (Bottom) */}
      <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-20 pb-safe">
        <nav className="flex justify-around py-3">
           {navigation.map((item) => {
             const isActive = location.pathname === item.href;
             return (
               <Link 
                 key={item.name} 
                 to={item.href} 
                 className={`flex flex-col items-center p-1 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
               >
                 <item.icon className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} />
                 <span className="text-[10px] font-medium mt-1">{item.name}</span>
               </Link>
             );
           })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:pl-64 pt-16 pb-20 md:pt-16 md:pb-0">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
