import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, Cloud, Zap, Bell, 
  Wifi, Settings, Timer, Lock, Leaf, Sun, Moon,
  RefreshCw, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Features: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const isDark = isAuthenticated && darkMode;

  const mainFeatures = [
    {
      icon: Droplets,
      title: 'Monitoreo de Humedad en Tiempo Real',
      description: 'Sensores de alta precisión que miden constantemente la humedad del suelo. Visualiza los datos en tiempo real y toma decisiones informadas sobre el riego de tus plantas.',
      color: 'emerald',
      details: [
        'Lecturas cada 5 segundos',
        'Precisión de ±2%',
        'Historial de 30 días',
        'Gráficos interactivos'
      ]
    },
    {
      icon: Cloud,
      title: 'Integración Meteorológica',
      description: 'Conectamos con servicios meteorológicos para obtener pronósticos precisos. El sistema ajusta automáticamente el riego basándose en las condiciones climáticas.',
      color: 'blue',
      details: [
        'Pronóstico de 7 días',
        'Detección de lluvia',
        'Ajuste por temperatura',
        'Datos de humedad ambiental'
      ]
    },
    {
      icon: Zap,
      title: 'Automatización Inteligente',
      description: 'Define umbrales personalizados y deja que el sistema se encargue del resto. El riego se activa automáticamente cuando las plantas lo necesitan.',
      color: 'orange',
      details: [
        'Umbrales personalizables',
        'Horarios programables',
        'Modo vacaciones',
        'Reglas condicionales'
      ]
    },
    {
      icon: Settings,
      title: 'Control Multiplataforma',
      description: 'Accede desde la web o nuestra aplicación móvil. Monitorea y controla tu sistema de riego desde cualquier lugar del mundo.',
      color: 'purple',
      details: [
        'App iOS y Android',
        'Interfaz web responsive',
        'Sincronización en tiempo real',
        'Modo offline'
      ]
    },
    {
      icon: Bell,
      title: 'Sistema de Alertas',
      description: 'Recibe notificaciones importantes sobre el estado de tu sistema. Alertas de nivel bajo de tanque, humedad crítica, desconexiones y más.',
      color: 'red',
      details: [
        'Notificaciones push',
        'Alertas por email',
        'Personalización de alertas',
        'Historial de eventos'
      ]
    },
    {
      icon: Timer,
      title: 'Estadísticas y Reportes',
      description: 'Analiza el rendimiento de tu sistema con estadísticas detalladas. Identifica patrones y optimiza el consumo de agua.',
      color: 'cyan',
      details: [
        'Consumo de agua',
        'Frecuencia de riegos',
        'Tendencias de humedad',
        'Exportación de datos'
      ]
    },
  ];

  const additionalFeatures = [
    { icon: Wifi, title: 'Conexión WiFi', description: 'Conecta fácilmente tu ESP32 a tu red doméstica' },
    { icon: Lock, title: 'Datos Seguros', description: 'Tus datos protegidos con encriptación de extremo a extremo' },
    { icon: RefreshCw, title: 'Actualizaciones OTA', description: 'Actualizaciones automáticas del firmware del ESP32' },
    { icon: Moon, title: 'Modo Oscuro', description: 'Interfaz adaptable para uso nocturno' },
    { icon: Cloud, title: 'Multi-idioma', description: 'Disponible en español e inglés' },
    { icon: Settings, title: 'Autenticación Segura', description: 'Protege tu cuenta con contraseñas seguras' },
    { icon: Timer, title: 'Programación', description: 'Programa riegos en horarios específicos' },
    { icon: Sun, title: 'Sensor de Luz', description: 'Mide la luz solar para optimizar el riego' },
  ];

  const colorClasses: Record<string, { bg: string; bgLight: string; bgLightDark: string; icon: string; border: string; borderDark: string }> = {
    emerald: { bg: 'bg-emerald-500', bgLight: 'bg-emerald-100', bgLightDark: 'bg-emerald-900/30', icon: 'text-emerald-600', border: 'border-emerald-200', borderDark: 'border-emerald-700' },
    blue: { bg: 'bg-blue-500', bgLight: 'bg-blue-100', bgLightDark: 'bg-blue-900/30', icon: 'text-blue-600', border: 'border-blue-200', borderDark: 'border-blue-700' },
    purple: { bg: 'bg-purple-500', bgLight: 'bg-purple-100', bgLightDark: 'bg-purple-900/30', icon: 'text-purple-600', border: 'border-purple-200', borderDark: 'border-purple-700' },
    orange: { bg: 'bg-orange-500', bgLight: 'bg-orange-100', bgLightDark: 'bg-orange-900/30', icon: 'text-orange-600', border: 'border-orange-200', borderDark: 'border-orange-700' },
    red: { bg: 'bg-red-500', bgLight: 'bg-red-100', bgLightDark: 'bg-red-900/30', icon: 'text-red-600', border: 'border-red-200', borderDark: 'border-red-700' },
    cyan: { bg: 'bg-cyan-500', bgLight: 'bg-cyan-100', bgLightDark: 'bg-cyan-900/30', icon: 'text-cyan-600', border: 'border-cyan-200', borderDark: 'border-cyan-700' },
  };

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className={`relative py-24 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-emerald-50 via-white to-cyan-50'}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-30 blur-3xl ${isDark ? 'bg-emerald-600' : 'bg-emerald-200'}`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
            isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <Settings size={16} />
            <span>Características</span>
          </div>
          
          <h1 className={`text-5xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Potentes características para un
            <span className="text-emerald-500"> riego perfecto</span>
          </h1>
          
          <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Descubre todas las herramientas que AgroMind pone a tu disposición 
            para automatizar y optimizar el riego de tus plantas.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className={`py-24 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const colors = colorClasses[feature.color];
              const isReversed = index % 2 === 1;

              return (
                <div 
                  key={index}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${isReversed ? 'lg:flex-row-reverse' : ''}`}
                >
                  <div className={isReversed ? 'lg:order-2' : ''}>
                    <div className={`w-16 h-16 ${isDark ? colors.bgLightDark : colors.bgLight} rounded-2xl flex items-center justify-center mb-6`}>
                      <Icon size={32} className={colors.icon} />
                    </div>
                    <h2 className={`text-3xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {feature.title}
                    </h2>
                    <p className={`text-lg mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className={`w-5 h-5 ${colors.bg} rounded-full flex items-center justify-center`}>
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`${isReversed ? 'lg:order-1' : ''}`}>
                    <div className={`${isDark ? colors.bgLightDark : colors.bgLight} rounded-3xl p-8 relative`}>
                      <div className={`rounded-2xl p-6 shadow-xl border ${
                        isDark ? `bg-gray-800 ${colors.borderDark}` : `bg-white ${colors.border}`
                      }`}>
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                            <Icon size={24} className="text-white" />
                          </div>
                          <div>
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title.split(' ')[0]}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Activo</p>
                          </div>
                        </div>
                        
                        {/* Mock visualization based on feature */}
                        {feature.color === 'emerald' && (
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Humedad actual</span>
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>67%</span>
                            </div>
                            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <div className="h-full w-2/3 bg-emerald-500 rounded-full"></div>
                            </div>
                            <div className={`flex justify-between text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              <span>0%</span>
                              <span>Óptimo: 60-80%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        )}
                        
                        {feature.color === 'blue' && (
                          <div className="grid grid-cols-4 gap-2">
                            {['Hoy', 'Mañana', 'Mié', 'Jue'].map((day, i) => (
                              <div key={i} className={`text-center p-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{day}</p>
                                {i === 1 ? (
                                  <Cloud size={20} className="mx-auto text-blue-500" />
                                ) : (
                                  <Sun size={20} className="mx-auto text-orange-500" />
                                )}
                                <p className={`text-sm font-bold mt-1 ${isDark ? 'text-white' : ''}`}>{24 + i}°</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {feature.color === 'orange' && (
                          <div className="space-y-3">
                            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Riego automático</span>
                              <div className="w-12 h-6 bg-orange-500 rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                              </div>
                            </div>
                            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Umbral mínimo</span>
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>30%</span>
                            </div>
                          </div>
                        )}

                        {feature.color === 'purple' && (
                          <div className="flex items-center justify-center gap-4">
                            <div className={`w-16 h-28 rounded-2xl border-4 flex items-center justify-center ${
                              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                            }`}>
                              <Leaf size={24} className="text-emerald-500" />
                            </div>
                            <div className={`w-24 h-16 rounded-xl border-4 flex items-center justify-center ${
                              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                            }`}>
                              <Leaf size={20} className="text-emerald-500" />
                            </div>
                          </div>
                        )}

                        {feature.color === 'red' && (
                          <div className="space-y-2">
                            {[
                              { text: 'Tanque bajo (15%)', type: 'warning' },
                              { text: 'Riego completado', type: 'success' },
                              { text: 'ESP32 reconectado', type: 'info' },
                            ].map((alert, i) => (
                              <div key={i} className={`p-3 rounded-xl text-sm ${
                                alert.type === 'warning' ? 'bg-orange-50 text-orange-700' :
                                alert.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                                'bg-blue-50 text-blue-700'
                              }`}>
                                {alert.text}
                              </div>
                            ))}
                          </div>
                        )}

                        {feature.color === 'cyan' && (
                          <div className="h-32 flex items-end justify-between gap-2">
                            {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                              <div 
                                key={i}
                                className="flex-1 bg-cyan-500 rounded-t-lg"
                                style={{ height: `${h}%` }}
                              ></div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className={`py-24 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Y mucho más...
            </h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Características adicionales que hacen de AgroMind la mejor opción
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div 
                key={index}
                className={`p-6 rounded-2xl hover:shadow-lg transition-shadow ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
                }`}>
                  <feature.icon size={24} className="text-emerald-600" />
                </div>
                <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-emerald-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            Comienza a usar todas estas características
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Crea tu cuenta gratuita y descubre el poder de la automatización inteligente.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl"
          >
            Comenzar Ahora
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Features;
