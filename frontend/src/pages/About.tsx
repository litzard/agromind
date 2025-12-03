import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Leaf, User, Zap, Bell, ChevronRight,
    Settings, Cpu, Wifi
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import { ScrollAnimation } from '../hooks/useScrollAnimation';

const About: React.FC = () => {
    const { darkMode } = useTheme();
    const isDark = darkMode;

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
        <div className="overflow-hidden relative z-10">
        <AnimatedBackground />
        
        {/* Hero */}
        <section className="relative py-24">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <ScrollAnimation animation="fadeRight" duration={800}>
                <div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm ${
                    isDark ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50' : 'bg-white/60 text-emerald-700 border border-emerald-200/50'
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

                    <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Nuestro objetivo es democratizar el acceso a sistemas de riego inteligente,
                    permitiendo que cualquier persona pueda cuidar sus plantas de manera eficiente
                    sin importar su conocimiento técnico.
                    </p>
                </div>
                </ScrollAnimation>

                <ScrollAnimation animation="fadeLeft" duration={800} delay={200}>
                <div className="relative">
                    <div className={`rounded-3xl p-8 shadow-2xl backdrop-blur-xl border ${isDark ? 'bg-gray-800/80 border-white/10' : 'bg-white/80 border-white/50'}`}>
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
                        <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
                        <Settings size={20} className="text-emerald-500" />
                        <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>Automatización del riego</span>
                        </div>
                        <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
                        <Cpu size={20} className="text-emerald-500" />
                        <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>Tecnología ESP32 + IoT</span>
                        </div>
                        <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50/80'}`}>
                        <Wifi size={20} className="text-emerald-500" />
                        <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>Monitoreo en tiempo real</span>
                        </div>
                    </div>
                    </div>
                </div>
                </ScrollAnimation>
            </div>
            </div>
        </section>

        {/* Mission & Vision */}
        <section className="relative py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12">
                <ScrollAnimation animation="fadeUp" delay={0}>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-10 text-white shadow-xl shadow-emerald-500/20 h-full">
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
                </ScrollAnimation>

                <ScrollAnimation animation="fadeUp" delay={150}>
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-10 text-white shadow-xl shadow-cyan-500/20 h-full">
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
                </ScrollAnimation>
            </div>
            </div>
        </section>

        {/* Values */}
        <section className="relative py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimation animation="fadeUp">
                <div className="text-center mb-16">
                <h2 className={`text-4xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Nuestros Valores
                </h2>
                <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Los principios que guían el desarrollo de AgroMind
                </p>
                </div>
            </ScrollAnimation>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value, index) => (
                <ScrollAnimation key={index} animation="fadeUp" delay={index * 100}>
                    <div 
                    className={`p-8 rounded-3xl text-center transition-all backdrop-blur-xl border h-full ${
                        isDark ? 'bg-gray-800/50 border-white/10 hover:bg-gray-800/70 hover:shadow-xl' : 'bg-white/60 border-white/50 hover:bg-white/80 hover:shadow-xl'
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
                </ScrollAnimation>
                ))}
            </div>
            </div>
        </section>

        {/* CTA */}
        <section className="relative py-24">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-95"></div>
            <ScrollAnimation animation="scale">
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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

export default About;
