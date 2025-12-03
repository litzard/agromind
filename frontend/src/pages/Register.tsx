import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock, User, Loader2, Check, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { API_CONFIG } from '../config/api';
import AnimatedBackground from '../components/AnimatedBackground';

// Requisitos de contraseña
const passwordRequirements = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'Una letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'Una letra minúscula', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'Un número', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'Un carácter especial (!@#$%^&*)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const isDark = darkMode;

  // Validar requisitos de contraseña
  const passwordValidation = useMemo(() => {
    return passwordRequirements.map(req => ({
      ...req,
      passed: req.test(password)
    }));
  }, [password]);

  const allRequirementsPassed = passwordValidation.every(req => req.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allRequirementsPassed) {
      setError('La contraseña no cumple con todos los requisitos');
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar');
      }

      // Redirigir a verificación de email
      navigate('/verify-email', { state: { email } });
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-[80vh] flex flex-col justify-center py-12 px-6 sm:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo - Mobile Style: 80x80 circle with emerald-50 bg */}
        <div className="flex flex-col items-center mb-12">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-50'}`}>
            <Leaf className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AgroMind</h1>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {error && (
            <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/30 border border-red-800/50' : 'bg-red-50 border border-red-100'}`}>
              <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                <span>⚠</span> {error}
              </p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Input - Mobile Style */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full h-14 pl-12 pr-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-base ${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:bg-gray-800/80' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                }`}
                placeholder="Nombre completo"
              />
            </div>

            {/* Email Input - Mobile Style */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full h-14 pl-12 pr-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-base ${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:bg-gray-800/80' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                }`}
                placeholder="Email"
              />
            </div>

            {/* Password Input - Mobile Style */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full h-14 pl-12 pr-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-base ${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:bg-gray-800/80' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                }`}
                placeholder="Contraseña"
              />
            </div>

            {/* Password Requirements */}
            {password.length > 0 && (
              <div className={`rounded-xl p-4 space-y-2 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Requisitos de contraseña</p>
                {passwordValidation.map((req) => (
                  <div key={req.id} className="flex items-center gap-2">
                    {req.passed ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className={`h-4 w-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    )}
                    <span className={`text-sm ${req.passed ? 'text-emerald-500 font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Confirm Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full h-14 pl-12 pr-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-base ${
                  isDark 
                    ? `bg-gray-800/50 text-white placeholder-gray-500 focus:bg-gray-800/80 ${
                        confirmPassword.length > 0 
                          ? passwordsMatch 
                            ? 'border-emerald-500' 
                            : 'border-red-500'
                          : 'border-gray-700'
                      }`
                    : `bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white ${
                        confirmPassword.length > 0 
                          ? passwordsMatch 
                            ? 'border-emerald-500' 
                            : 'border-red-300'
                          : 'border-gray-200'
                      }`
                }`}
                placeholder="Confirmar contraseña"
              />
              {confirmPassword.length > 0 && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  {passwordsMatch ? (
                    <Check className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-400" />
                  )}
                </div>
              )}
            </div>

            {/* Submit Button - Mobile Style: Solid emerald, h-12, rounded-xl */}
            <button
              type="submit"
              disabled={loading || !allRequirementsPassed || !passwordsMatch}
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
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>¿Ya tienes cuenta?</span>
            <Link to="/login" className="font-semibold text-emerald-500 hover:text-emerald-600 transition-colors">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default Register;
