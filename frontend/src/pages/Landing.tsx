import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, Droplets, Sun, Cloud, Zap, 
  Lock, Wifi, ChevronRight, Check,
  Timer, Bell, Settings
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import { ScrollAnimation } from '../hooks/useScrollAnimation';

const Landing: React.FC = () => {
  const { darkMode } = useTheme();
  const isDark = darkMode;

  return (
    <div className="overflow-hidden relative z-10">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <ScrollAnimation animation="fadeRight" duration={800}>
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm ${
                  isDark ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50' : 'bg-white/60 text-emerald-700 border border-emerald-200/50'
                }`}>
                  <Leaf size={16} />
                  <span>Sistema Inteligente de Riego</span>
                </div>
                
                <h1 className={`text-5xl lg:text-6xl font-extrabold leading-tight mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Cuida tus plantas con
                  <span className="text-emerald-500"> tecnología inteligente</span>
                </h1>
                
                <p className={`text-xl mb-8 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  AgroMind automatiza el riego de tus cultivos usando sensores IoT, 
                  predicciones meteorológicas y algoritmos inteligentes. 
                  Ahorra agua y tiempo mientras tus plantas crecen sanas.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-semibold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                  >
                    Comenzar Gratis
                    <ChevronRight size={20} />
                  </Link>
                  <Link
                    to="/about"
                    className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg transition-all backdrop-blur-sm ${
                      isDark 
                        ? 'bg-gray-800/60 text-white border-2 border-gray-700/50 hover:border-gray-600 hover:bg-gray-700/60'
                        : 'bg-white/60 text-gray-700 border-2 border-white/50 hover:bg-white/80'
                    }`}
                  >
                    Conocer Más
                  </Link>
                </div>

                {/* Stats */}
                <div className="mt-12 flex gap-8">
                  {[
                    { value: '40%', label: 'Ahorro de agua' },
                    { value: '24/7', label: 'Monitoreo continuo' },
                    { value: '100%', label: 'Automatizado' },
                  ].map((stat, i) => (
                    <div key={i} className={`backdrop-blur-sm px-4 py-3 rounded-xl ${isDark ? 'bg-gray-800/40' : 'bg-white/40'}`}>
                      <div className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollAnimation>

            {/* Hero Image / Illustration */}
            <ScrollAnimation animation="fadeLeft" duration={800} delay={200}>
              <div className="relative">
                <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-8 shadow-2xl shadow-emerald-500/20">
                  {/* Mock Dashboard Preview */}
                  <div className={`rounded-2xl p-6 shadow-lg backdrop-blur-xl ${isDark ? 'bg-gray-800/90' : 'bg-white/90'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Humedad del Suelo</p>
                        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>67%</p>
                      </div>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                        <Droplets size={32} className="text-emerald-500" />
                      </div>
                    </div>
                    
                    <div className={`h-2 rounded-full overflow-hidden mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="h-full w-2/3 bg-emerald-500 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: Sun, color: 'text-orange-500', label: 'Luz', value: '85%' },
                        { icon: Droplets, color: 'text-blue-500', label: 'Tanque', value: '72%' },
                        { icon: Cloud, color: 'text-cyan-500', label: 'Temp', value: '24°' },
                      ].map((item, i) => (
                        <div key={i} className={`text-center p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
                          <item.icon size={20} className={`mx-auto ${item.color} mb-1`} />
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</p>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Floating elements */}
                  <div className={`absolute -top-4 -right-4 rounded-2xl p-4 shadow-lg backdrop-blur-xl ${isDark ? 'bg-gray-800/90' : 'bg-white/90'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>ESP32 Online</span>
                    </div>
                  </div>

                  <div className={`absolute -bottom-4 -left-4 rounded-2xl p-4 shadow-lg backdrop-blur-xl ${isDark ? 'bg-gray-800/90' : 'bg-white/90'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                        <Cloud size={20} className="text-blue-500" />
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pronóstico</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sin lluvia hoy</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimation animation="fadeUp">
            <div className="text-center mb-16">
              <h2 className={`text-4xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Todo lo que necesitas para un riego perfecto
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Tecnología avanzada al servicio de tus plantas
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Droplets, title: 'Monitoreo de Humedad', description: 'Sensores precisos que miden la humedad del suelo en tiempo real para regar solo cuando es necesario.', color: 'emerald' },
              { icon: Cloud, title: 'Integración Meteorológica', description: 'Consulta el pronóstico del clima y evita regar antes de una lluvia. Ahorra agua automáticamente.', color: 'blue' },
              { icon: Settings, title: 'Control desde el Móvil', description: 'Monitorea y controla tu sistema de riego desde cualquier lugar con nuestra app móvil.', color: 'purple' },
              { icon: Zap, title: 'Riego Automático', description: 'Configura umbrales y deja que el sistema riegue automáticamente cuando tus plantas lo necesiten.', color: 'orange' },
              { icon: Bell, title: 'Alertas Inteligentes', description: 'Recibe notificaciones cuando el tanque esté bajo, la humedad sea crítica o haya problemas.', color: 'red' },
              { icon: Timer, title: 'Historial y Estadísticas', description: 'Visualiza el historial de riegos y analiza patrones para optimizar el cuidado de tus plantas.', color: 'cyan' },
            ].map((feature, index) => {
              const colorClasses: Record<string, { bg: string; bgDark: string; icon: string }> = {
                emerald: { bg: 'bg-emerald-100', bgDark: 'bg-emerald-900/30', icon: 'text-emerald-600' },
                blue: { bg: 'bg-blue-100', bgDark: 'bg-blue-900/30', icon: 'text-blue-600' },
                purple: { bg: 'bg-purple-100', bgDark: 'bg-purple-900/30', icon: 'text-purple-600' },
                orange: { bg: 'bg-orange-100', bgDark: 'bg-orange-900/30', icon: 'text-orange-600' },
                red: { bg: 'bg-red-100', bgDark: 'bg-red-900/30', icon: 'text-red-600' },
                cyan: { bg: 'bg-cyan-100', bgDark: 'bg-cyan-900/30', icon: 'text-cyan-600' },
              };
              const Icon = feature.icon;
              const colors = colorClasses[feature.color];

              return (
                <ScrollAnimation key={index} animation="fadeUp" delay={index * 100}>
                  <div 
                    className={`group p-8 rounded-3xl transition-all duration-300 backdrop-blur-xl border h-full ${
                      isDark 
                        ? 'bg-gray-800/50 border-white/10 hover:bg-gray-800/70 hover:shadow-xl hover:shadow-emerald-500/5' 
                        : 'bg-white/60 border-white/50 hover:bg-white/80 hover:shadow-xl'
                    }`}
                  >
                    <div className={`w-14 h-14 ${isDark ? colors.bgDark : colors.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon size={28} className={colors.icon} />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                    <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{feature.description}</p>
                  </div>
                </ScrollAnimation>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-24">
        <div className={`absolute inset-0 ${isDark ? 'bg-gray-900/80' : 'bg-gray-900/90'} backdrop-blur-sm`}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimation animation="fadeUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold mb-4 text-white">
                ¿Cómo funciona?
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Tres simples pasos para automatizar tu riego
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Wifi, title: 'Conecta tu ESP32', description: 'Instala los sensores y conecta el ESP32 a tu red WiFi. La configuración es rápida y sencilla.' },
              { step: '02', icon: Settings, title: 'Configura tus zonas', description: 'Crea zonas de riego, ajusta umbrales de humedad y personaliza las opciones según tus plantas.' },
              { step: '03', icon: Timer, title: 'Deja que AgroMind trabaje', description: 'El sistema monitoreará y regará automáticamente. Tú solo relájate y disfruta de tus plantas.' },
            ].map((item, index) => (
              <ScrollAnimation key={index} animation="fadeUp" delay={index * 150}>
                <div className="relative h-full">
                  <div className="text-8xl font-extrabold text-white/5 absolute -top-6 -left-2">
                    {item.step}
                  </div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/15 transition-all h-full">
                    <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                      <item.icon size={28} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollAnimation animation="fadeRight">
              <div>
                <h2 className={`text-4xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Beneficios de usar AgroMind
                </h2>
                <p className={`text-xl mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Nuestro sistema inteligente te ayuda a cuidar mejor tus plantas mientras ahorras recursos.
                </p>

                <div className="space-y-4">
                  {[
                    'Ahorra hasta un 40% de agua con riego preciso',
                    'Monitoreo 24/7 sin necesidad de estar presente',
                    'Evita el riego excesivo o insuficiente',
                    'Integración con pronósticos meteorológicos',
                    'Historial completo de todos los eventos',
                    'Notificaciones en tiempo real',
                  ].map((benefit, index) => (
                    <div key={index} className={`flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm ${isDark ? 'bg-gray-800/40' : 'bg-white/50'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'
                      }`}>
                        <Check size={14} className="text-emerald-600" />
                      </div>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animation="fadeLeft" delay={200}>
              <div className="relative">
                <div className={`rounded-3xl p-8 backdrop-blur-xl ${isDark ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-gradient-to-br from-emerald-100/80 to-cyan-100/80 border border-white/50'}`}>
                  <img 
                    src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop" 
                    alt="Plantas saludables"
                    className="rounded-2xl shadow-xl w-full"
                  />
                </div>
                
                {/* Floating card */}
                <div className={`absolute -bottom-6 -left-6 rounded-2xl p-5 shadow-xl backdrop-blur-xl ${isDark ? 'bg-gray-800/90' : 'bg-white/90'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Lock size={24} className="text-white" />
                    </div>
                    <div>
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Plantas Protegidas</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Riego inteligente activo</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-95"></div>
        <ScrollAnimation animation="scale">
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-extrabold text-white mb-6">
              ¿Listo para automatizar tu riego?
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Únete a AgroMind y transforma la manera en que cuidas tus plantas. 
              Comienza gratis hoy mismo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl"
              >
                Crear Cuenta Gratis
                <ChevronRight size={20} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-lg hover:bg-emerald-700 transition-all border-2 border-emerald-400"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </ScrollAnimation>
      </section>
    </div>
  );
};

export default Landing;
