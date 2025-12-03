import React, { useState } from 'react';
import { 
  Mail, Wifi, Home, Zap, Bell,
  Clock, CheckCircle2, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Contact: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const isDark = isAuthenticated && darkMode;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    // Simulate sending
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 2000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'contacto@agromind.com',
      description: 'Respuesta en 24-48 horas'
    },
    {
      icon: Wifi,
      title: 'Teléfono',
      value: '+52 123 456 7890',
      description: 'Lunes a Viernes, 9am - 6pm'
    },
    {
      icon: Home,
      title: 'Ubicación',
      value: 'Ciudad de México, México',
      description: 'Proyecto universitario'
    },
  ];

  const faqs = [
    {
      question: '¿Es gratuito usar AgroMind?',
      answer: 'Sí, AgroMind es completamente gratuito. Es un proyecto escolar abierto a todos.'
    },
    {
      question: '¿Qué hardware necesito?',
      answer: 'Necesitas un ESP32, sensores de humedad, y opcionalmente una bomba de agua con relé.'
    },
    {
      question: '¿Puedo usar múltiples zonas?',
      answer: 'Sí, puedes configurar múltiples zonas de riego, cada una con su propio ESP32.'
    },
    {
      question: '¿Funciona sin internet?',
      answer: 'El ESP32 puede funcionar offline, pero necesitas conexión para ver datos en la app.'
    },
  ];

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
            <Bell size={16} />
            <span>Contacto</span>
          </div>
          
          <h1 className={`text-5xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ¿Tienes alguna
            <span className="text-emerald-500"> pregunta?</span>
          </h1>
          
          <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Estamos aquí para ayudarte. Envíanos un mensaje o consulta 
            nuestras preguntas frecuentes.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className={`py-24 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Información de Contacto
              </h2>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
                    }`}>
                      <info.icon size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{info.title}</p>
                      <p className="text-emerald-600">{info.value}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-10 p-6 rounded-2xl ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Clock size={20} className="text-emerald-600" />
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Horario de Atención</span>
                </div>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  Lunes a Viernes: 9:00 AM - 6:00 PM<br />
                  Sábados: 10:00 AM - 2:00 PM<br />
                  Domingos: Cerrado
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className={`rounded-3xl p-8 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Envíanos un mensaje
                </h2>

                {status === 'success' ? (
                  <div className="text-center py-12">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                      isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
                    }`}>
                      <CheckCircle2 size={40} className="text-emerald-600" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ¡Mensaje enviado!
                    </h3>
                    <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Te responderemos lo antes posible.
                    </p>
                    <button
                      onClick={() => setStatus('idle')}
                      className="text-emerald-600 font-semibold hover:underline"
                    >
                      Enviar otro mensaje
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                          Nombre
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            isDark 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-200 text-gray-900'
                          }`}
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                            isDark 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-200 text-gray-900'
                          }`}
                          placeholder="tu@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Asunto
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                          isDark 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      >
                        <option value="">Selecciona un asunto</option>
                        <option value="general">Consulta general</option>
                        <option value="technical">Soporte técnico</option>
                        <option value="hardware">Dudas sobre hardware</option>
                        <option value="collaboration">Colaboración</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Mensaje
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none ${
                          isDark 
                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-200 text-gray-900'
                        }`}
                        placeholder="Escribe tu mensaje aquí..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status === 'sending' ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Zap size={20} />
                          Enviar Mensaje
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className={`py-24 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Preguntas Frecuentes
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Respuestas a las dudas más comunes
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className={`rounded-2xl p-6 shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              >
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {faq.question}
                </h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className={`h-96 relative ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Home size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Mapa de ubicación</p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Integración de Google Maps aquí</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
