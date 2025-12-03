import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ChevronLeft, Lock, Loader2, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { API_CONFIG } from '../config/api';
import AnimatedBackground from '../components/AnimatedBackground';

type Step = 'email' | 'code' | 'newPassword' | 'success';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { darkMode } = useTheme();
  const isDark = darkMode;
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStep('code');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      const newCode = [...code];
      pasted.forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setCode(newCode);
      inputRefs.current[5]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Ingresa el código completo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setStep('newPassword');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.join(''), newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-[80vh] flex flex-col justify-center py-12 px-6 sm:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-50'}`}>
            <Lock className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {step === 'email' && 'Recuperar Contraseña'}
            {step === 'code' && 'Verificar Código'}
            {step === 'newPassword' && 'Nueva Contraseña'}
            {step === 'success' && '¡Listo!'}
          </h1>
          <p className={`text-sm mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {step === 'email' && 'Ingresa tu correo para recibir un código'}
            {step === 'code' && `Enviamos un código a ${email}`}
            {step === 'newPassword' && 'Crea una nueva contraseña segura'}
            {step === 'success' && 'Tu contraseña ha sido actualizada'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-red-900/30 border border-red-800/50' : 'bg-red-50 border border-red-100'}`}>
            <p className={`text-sm text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          </div>
        )}

        {/* Step: Email */}
        {step === 'email' && (
          <form className="space-y-6" onSubmit={handleSendCode}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full h-14 pl-12 pr-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-base ${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="Email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Enviar Código <ChevronRight size={18} /></>}
            </button>
            
            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-emerald-500 hover:text-emerald-600 text-sm">
                <ChevronLeft size={16} /> Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}

        {/* Step: Code */}
        {step === 'code' && (
          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all ${
                    digit 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                      : isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white text-gray-900'
                  } focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20`}
                />
              ))}
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={loading || code.join('').length !== 6}
              className="w-full h-12 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Verificar <ChevronRight size={18} /></>}
            </button>

            <button onClick={() => setStep('email')} className="w-full text-center text-emerald-500 font-medium text-sm">
              Cambiar correo
            </button>
          </div>
        )}

        {/* Step: New Password */}
        {step === 'newPassword' && (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full h-14 pl-12 pr-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-base ${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="Nueva contraseña"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full h-14 pl-12 pr-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-base ${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="Confirmar contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 mt-6"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Cambiar Contraseña'}
            </button>
          </form>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-50'}`}>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
