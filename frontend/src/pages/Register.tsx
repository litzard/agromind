import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-white flex flex-col justify-center py-12 px-6 sm:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo - Mobile Style: 80x80 circle with emerald-50 bg */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <Leaf className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">AgroMind</h1>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <span>⚠</span> {error}
              </p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Input - Mobile Style */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-base"
                placeholder="Nombre completo"
              />
            </div>

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

            {/* Password Input - Mobile Style */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-base"
                placeholder="Contraseña"
              />
            </div>

            {/* Submit Button - Mobile Style: Solid emerald, h-12, rounded-xl */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          {/* Footer - Mobile Style */}
          <div className="flex justify-center items-center gap-1 mt-6">
            <span className="text-gray-600">¿Ya tienes cuenta?</span>
            <Link to="/login" className="font-semibold text-emerald-500 hover:text-emerald-600 transition-colors">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
