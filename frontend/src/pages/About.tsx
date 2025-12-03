import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, User, Settings, Zap, 
  Bell, Cpu, ChevronRight,
  Wifi, Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const About: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const isDark = isAuthenticated && darkMode;

  const skills = [
    { name: 'Frontend', description: 'React, React Native, TypeScript, Tailwind CSS', icon: Zap },
    { name: 'Backend', description: 'Node.js, Express, MongoDB, APIs REST', icon: Settings },
    { name: 'IoT & Hardware', description: 'ESP32, Arduino, Sensores, Electrónica', icon: Cpu },
  ];

  const values = [
    {
      icon: Leaf,
      title: 'Sostenibilidad',
      description: 'Creemos en el uso eficiente del agua y en prácticas agrícolas sostenibles.'
    },
    {
      icon: Zap,
      title: 'Innovación',
      description: 'Aplicamos tecnología de punta para resolver problemas cotidianos.'
    },
    {
      icon: User,
      title: 'Accesibilidad',
      description: 'Hacemos la tecnología accesible para todos, sin importar su nivel técnico.'
    },
    {
      icon: Bell,
      title: 'Pasión',
      description: 'Amamos lo que hacemos y nos apasiona ayudar a las plantas a crecer.'
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className={`relative py-24 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-emerald-50 via-white to-cyan-50'}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-30 blur-3xl ${isDark ? 'bg-emerald-600' : 'bg-emerald-200'}`}></div>
          <div className={`absolute bottom-0 right-0 w-60 h-60 rounded-full opacity-30 blur-3xl ${isDark ? 'bg-cyan-600' : 'bg-cyan-200'}`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
                isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <Leaf size={16} />
                <span>Proyecto Escolar</span>
              </div>
              
              <h1 className={`text-5xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Sobre
                <span className="text-emerald-500"> AgroMind</span>
              </h1>
              
              <p className={`text-xl leading-relaxed mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                AgroMind nació como un proyecto escolar con la visión de combinar 
                tecnología IoT y automatización para resolver un problema real: 
                el riego eficiente de plantas y cultivos.
              </p>

              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Desarrollador Full Stack</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Proyecto individual de tecnología IoT</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className={`rounded-3xl p-8 shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                    <Leaf size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AgroMind</h3>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Sistema de Riego Inteligente</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Settings size={20} className="text-emerald-500" />
                    <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>Automatización del riego</span>
                  </div>
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Cpu size={20} className="text-emerald-500" />
                    <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>Tecnología ESP32 + IoT</span>
                  </div>
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Wifi size={20} className="text-emerald-500" />
                    <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>React + Node.js + React Native</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className={`py-24 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-10 text-white">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Settings size={28} className="text-white" />
              </div>
              <h2 className="text-3xl font-extrabold mb-4">Nuestra Misión</h2>
              <p className="text-lg text-emerald-100 leading-relaxed">
                Democratizar el acceso a sistemas de riego automatizado mediante 
                tecnología accesible y fácil de usar, ayudando a las personas a 
                cuidar mejor sus plantas mientras ahorran agua y tiempo.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-10 text-white">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap size={28} className="text-white" />
              </div>
              <h2 className="text-3xl font-extrabold mb-4">Nuestra Visión</h2>
              <p className="text-lg text-cyan-100 leading-relaxed">
                Convertirnos en una referencia en soluciones IoT para agricultura 
                inteligente, expandiendo nuestras capacidades a sistemas más 
                complejos y cultivos de mayor escala.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={`py-24 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Nuestros Valores
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Los principios que guían el desarrollo de AgroMind
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div 
                key={index}
                className={`p-8 rounded-3xl text-center transition-shadow ${
                  isDark ? 'bg-gray-800 hover:shadow-xl' : 'bg-white hover:shadow-xl'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                  isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
                }`}>
                  <value.icon size={32} className="text-emerald-600" />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value.title}</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer & Skills */}
      <section className={`py-24 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Developer Card */}
            <div className="text-center lg:text-left">
              <div className="inline-block mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 shadow-2xl shadow-emerald-500/30">
                  <User size={56} className="text-white" />
                </div>
              </div>
              <h2 className={`text-3xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Desarrollador Full Stack
              </h2>
              <p className="text-emerald-600 font-semibold text-lg mb-4">Full Stack Developer & IoT</p>
              <p className={`text-lg leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Estudiante apasionado por la tecnología, encargado del desarrollo completo 
                de AgroMind: desde el diseño de interfaces hasta la programación del 
                microcontrolador ESP32, pasando por el backend y la aplicación móvil.
              </p>
              <div className="flex justify-center lg:justify-start gap-3">
                <a 
                  href="#" 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-emerald-500 hover:text-white' 
                      : 'bg-gray-100 text-gray-500 hover:bg-emerald-500 hover:text-white'
                  }`}
                >
                  <Wifi size={20} />
                </a>
                <a 
                  href="#" 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-emerald-500 hover:text-white' 
                      : 'bg-gray-100 text-gray-500 hover:bg-emerald-500 hover:text-white'
                  }`}
                >
                  <Mail size={20} />
                </a>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-6">
              <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Áreas de Desarrollo
              </h3>
              {skills.map((skill, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-2xl transition-all ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-white hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
                    }`}>
                      <skill.icon size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{skill.name}</h4>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{skill.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">
              Tecnologías Utilizadas
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Stack tecnológico moderno para una solución robusta
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'React', category: 'Frontend Web' },
              { name: 'React Native', category: 'App Móvil' },
              { name: 'Node.js', category: 'Backend' },
              { name: 'TypeScript', category: 'Lenguaje' },
              { name: 'ESP32', category: 'Microcontrolador' },
              { name: 'MongoDB', category: 'Base de Datos' },
              { name: 'Tailwind CSS', category: 'Estilos' },
              { name: 'Arduino', category: 'Firmware' },
            ].map((tech, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10"
              >
                <p className="text-lg font-bold mb-1">{tech.name}</p>
                <p className="text-sm text-gray-400">{tech.category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-emerald-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            ¿Te interesa el proyecto?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Prueba AgroMind y descubre cómo la tecnología puede ayudarte 
            a cuidar mejor tus plantas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl"
            >
              Probar AgroMind
              <ChevronRight size={20} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-lg hover:bg-emerald-700 transition-all border-2 border-emerald-400"
            >
              Contactar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
