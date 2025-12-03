import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import Schedules from './pages/Schedules';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import Landing from './pages/Landing';
import About from './pages/About';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Componente para proteger rutas - sin pantalla blanca
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Componente para redirigir usuarios autenticados
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public landing pages - use Layout for all */}
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      
      {/* Auth pages */}
      <Route path="/login" element={
        <PublicRoute>
          <Layout><Login /></Layout>
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Layout><Register /></Layout>
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <Layout><ForgotPassword /></Layout>
        </PublicRoute>
      } />
      <Route path="/verify-email" element={
        <PublicRoute>
          <Layout><VerifyEmail /></Layout>
        </PublicRoute>
      } />
      
      {/* Protected pages */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Layout><Dashboard /></Layout>
        </PrivateRoute>
      } />
      <Route path="/statistics" element={
        <PrivateRoute>
          <Layout><Statistics /></Layout>
        </PrivateRoute>
      } />
      <Route path="/schedules" element={
        <PrivateRoute>
          <Layout><Schedules /></Layout>
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <Layout><Profile /></Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <ScrollToTop />
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

