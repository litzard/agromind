import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ChevronLeft, Lock, Loader2 } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Sending recovery email to:', email);
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-[80vh] bg-white flex flex-col justify-center py-12 px-6 sm:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo - Mobile Style: 80x80 circle with emerald-50 bg */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Recuperar Contraseña</h1>
          <p className="text-sm text-gray-500 mt-2">Te enviaremos un enlace para restablecerla</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Input - Mobile Style */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-base"
                  placeholder="Email"
                />
              </div>

              {/* Submit Button - Mobile Style */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Enlace'
                )}
              </button>
              
              {/* Back Link */}
              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-emerald-500 hover:text-emerald-600 text-sm transition-colors">
                  <ChevronLeft size={16} />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Correo enviado!</h3>
              <p className="text-gray-500 mb-6">
                Si existe una cuenta asociada a <span className="text-emerald-500 font-semibold">{email}</span>, recibirás las instrucciones en breve.
              </p>
              
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 font-semibold hover:bg-gray-100 transition-colors rounded-xl"
              >
                <ChevronLeft size={18} />
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
