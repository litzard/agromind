import React, { useState, useEffect } from 'react';
import { Save, Cloud, Droplets, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';

interface Zone {
  id: string;
  name: string;
  type: 'Outdoor' | 'Indoor' | 'Greenhouse';
  config: {
    moistureThreshold: number;
    wateringDuration: number;
    autoMode: boolean;
    respectRainForecast: boolean;
    useWeatherApi: boolean;
  };
}

const Configuration: React.FC = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Cargar zonas del usuario
  useEffect(() => {
    const loadZones = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${API_URL}/zones/${user.id}`);
        if (!response.ok) throw new Error('Error al cargar zonas');
        
        const data = await response.json();
        setZones(data);
        if (data.length > 0) {
          setSelectedZone(data[0]);
        }
      } catch (error) {
        console.error('Error al cargar zonas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadZones();
  }, [user?.id]);

  // Cargar tema
  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(storedDarkMode);
  }, []);

  // Aplicar modo oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSaveZone = async () => {
    if (!selectedZone) return;

    try {
      const response = await fetch(`${API_URL}/zones/${selectedZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: selectedZone.config
        })
      });

      if (!response.ok) throw new Error('Error al guardar configuración');

      // Actualizar lista de zonas
      setZones(prev => prev.map(z => z.id === selectedZone.id ? selectedZone : z));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const handleSaveDarkMode = () => {
    localStorage.setItem('darkMode', darkMode.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 dark:text-gray-400">Cargando configuración...</p>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 dark:text-gray-400">No tienes zonas creadas aún.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centro de Configuración</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Ajusta los parámetros de cada zona de forma independiente.</p>
        </div>
      </div>

      <div className="grid gap-6">
        
        {/* Tarjeta: Apariencia Global */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-2xl text-purple-600 dark:text-purple-400">
              {darkMode ? <Moon size={24} /> : <Sun size={24} />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Apariencia</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personaliza la experiencia visual de la aplicación.</p>
            </div>
            <button 
              onClick={handleSaveDarkMode}
              className="flex items-center gap-2 bg-gray-900 dark:bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-purple-700 transition-all shadow-lg shadow-gray-200 dark:shadow-none active:scale-95 text-sm"
            >
              <Save size={16} />
              {saved ? '¡Guardado!' : 'Guardar'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600">
            <span className="font-medium text-gray-700 dark:text-gray-200">Modo Oscuro</span>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-purple-600' : 'bg-gray-300'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        {/* Selector de Zona */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Selecciona una Zona para Configurar</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {zones.map(zone => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`p-4 rounded-2xl border-2 transition-all font-medium ${
                  selectedZone?.id === zone.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {zone.name}
              </button>
            ))}
          </div>
        </div>

        {selectedZone && (
          <>
            {/* Tarjeta: Umbral de Riego */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
                  <Droplets size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Umbral de Riego - {selectedZone.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nivel mínimo de humedad antes de activar la bomba.</p>
                </div>
                <button 
                  onClick={handleSaveZone}
                  className="flex items-center gap-2 bg-gray-900 dark:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-emerald-700 transition-all shadow-lg shadow-gray-200 dark:shadow-none active:scale-95 text-sm"
                >
                  <Save size={16} />
                  {saved ? '¡Guardado!' : 'Guardar'}
                </button>
              </div>

              <div className="px-4">
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-bold text-gray-400">Seco (0%)</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedZone.config.moistureThreshold}%</span>
                  <span className="text-sm font-bold text-gray-400">Húmedo (100%)</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={selectedZone.config.moistureThreshold} 
                  onChange={(e) => setSelectedZone({
                    ...selectedZone,
                    config: { ...selectedZone.config, moistureThreshold: parseInt(e.target.value) }
                  })}
                  className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all"
                />
                <p className="text-xs text-gray-400 mt-4 text-center">
                  Recomendado: 30% para césped, 40% para hortalizas.
                </p>
              </div>
            </div>

            {/* Tarjeta: API de Clima */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
                  <Cloud size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Integración Meteorológica - {selectedZone.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedZone.type === 'Indoor' 
                      ? 'Para zonas interiores, se recomienda desactivar esta opción.'
                      : 'Conecta con OpenWeatherMap para prevenir riegos innecesarios.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Toggle API Clima */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Usar Predicción del Clima</span>
                  <button 
                    onClick={() => setSelectedZone({
                      ...selectedZone,
                      config: { ...selectedZone.config, useWeatherApi: !selectedZone.config.useWeatherApi }
                    })}
                    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${selectedZone.config.useWeatherApi ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${selectedZone.config.useWeatherApi ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                {/* Toggle Respetar Lluvia */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Respetar Pronóstico de Lluvia</span>
                  <button 
                    onClick={() => setSelectedZone({
                      ...selectedZone,
                      config: { ...selectedZone.config, respectRainForecast: !selectedZone.config.respectRainForecast }
                    })}
                    disabled={!selectedZone.config.useWeatherApi}
                    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                      selectedZone.config.useWeatherApi 
                        ? (selectedZone.config.respectRainForecast ? 'bg-blue-500' : 'bg-gray-300')
                        : 'bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${selectedZone.config.respectRainForecast ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                {!selectedZone.config.useWeatherApi && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 px-4">
                    ⚠️ API de clima desactivada. El sistema no considerará las condiciones meteorológicas.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Configuration;
