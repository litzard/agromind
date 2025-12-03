import React, { useState, useEffect } from 'react';
import { Save, Cloud, Droplets, RefreshCw, Timer, Loader2, CloudRain, Settings, Check, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';
import type { Zone } from '../types';

const Badge = ({ type }: { type: string }) => {
  const config: Record<string, { bg: string; text: string; darkBg: string; darkText: string; label: string }> = {
    Outdoor: { bg: 'bg-emerald-100', text: 'text-emerald-700', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400', label: 'Exterior' },
    Indoor: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400', label: 'Interior' },
    Greenhouse: { bg: 'bg-orange-100', text: 'text-orange-700', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400', label: 'Invernadero' },
  };
  const c = config[type] || config.Outdoor;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.darkBg} ${c.text} ${c.darkText}`}>
      {c.label}
    </span>
  );
};

const Configuration: React.FC = () => {
  const { user, addNotification } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadZones = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${user.id}`);
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

  const handleSaveZone = async () => {
    if (!selectedZone || saving) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${selectedZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: selectedZone.config })
      });

      if (!response.ok) throw new Error('Error al guardar configuración');

      setZones(prev => prev.map(z => z.id === selectedZone.id ? selectedZone : z));
      
      setSaved(true);
      addNotification('Configuración Guardada', `${selectedZone.name} actualizada.`, 'info');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error al guardar:', error);
      addNotification('Error', 'No se pudo guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const adjustThreshold = (delta: number) => {
    if (!selectedZone) return;
    const newValue = Math.max(0, Math.min(100, selectedZone.config.moistureThreshold + delta));
    setSelectedZone({
      ...selectedZone,
      config: { ...selectedZone.config, moistureThreshold: newValue }
    });
  };

  const adjustDuration = (delta: number) => {
    if (!selectedZone) return;
    const newValue = Math.max(5, Math.min(120, (selectedZone.config.wateringDuration || 10) + delta));
    setSelectedZone({
      ...selectedZone,
      config: { ...selectedZone.config, wateringDuration: newValue }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
          <Settings size={64} className="mx-auto text-gray-200 dark:text-gray-600 mb-4" />
          <p className="text-gray-800 dark:text-white text-xl font-bold">No tienes zonas configuradas</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Crea una zona en el Dashboard para configurarla</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Configuración</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ajusta los parámetros de cada zona</p>
      </div>

      {/* Zone Selector - Mobile Style */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Home size={20} className="text-emerald-500" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Zona Activa</h2>
        </div>
        <div className="space-y-2">
          {zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone)}
              className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                selectedZone?.id === zone.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 shadow-sm'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-bold ${selectedZone?.id === zone.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-white'}`}>
                  {zone.name}
                </span>
                <Badge type={zone.type} />
              </div>
              {selectedZone?.id === zone.id && (
                <Check size={24} className="text-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedZone && (
        <>
          {/* Moisture Threshold - Mobile Style */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Droplets size={24} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Umbral de Humedad</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nivel mínimo para activar riego</p>
              </div>
            </div>

            {/* Big Number Display */}
            <div className="flex items-baseline justify-center mb-6">
              <span className="text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {selectedZone.config.moistureThreshold}
              </span>
              <span className="text-2xl font-bold text-gray-400 ml-1">%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${selectedZone.config.moistureThreshold}%` }}
              />
            </div>

            {/* Adjustment Buttons - Mobile Style */}
            <div className="flex justify-around items-center mb-4">
              <button onClick={() => adjustThreshold(-10)} className="flex flex-col items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <span className="text-emerald-500 text-2xl font-bold">−</span>
                </div>
                <span className="text-xs font-bold text-gray-400 mt-1">-10</span>
              </button>
              <button onClick={() => adjustThreshold(-5)} className="flex flex-col items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <span className="w-7 h-7 flex items-center justify-center text-emerald-500 text-xl">−</span>
                <span className="text-xs font-bold text-gray-400 mt-1">-5</span>
              </button>
              <button onClick={() => adjustThreshold(5)} className="flex flex-col items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <span className="w-7 h-7 flex items-center justify-center text-emerald-500 text-xl">+</span>
                <span className="text-xs font-bold text-gray-400 mt-1">+5</span>
              </button>
              <button onClick={() => adjustThreshold(10)} className="flex flex-col items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <span className="text-emerald-500 text-2xl font-bold">+</span>
                </div>
                <span className="text-xs font-bold text-gray-400 mt-1">+10</span>
              </button>
            </div>

            {/* Labels */}
            <div className="flex justify-between text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Droplets size={14} className="text-gray-300" />
                <span>Seco</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets size={14} className="text-emerald-500" />
                <span>Húmedo</span>
              </div>
            </div>
          </div>

          {/* Watering Duration - Mobile Style */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Timer size={24} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tiempo de Riego</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Duración del riego automático y manual</p>
              </div>
            </div>

            {/* Big Number Display */}
            <div className="flex items-baseline justify-center mb-6">
              <span className="text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {selectedZone.config.wateringDuration || 10}
              </span>
              <span className="text-2xl font-bold text-gray-400 ml-1">seg</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((selectedZone.config.wateringDuration || 10) / 120) * 100)}%` }}
              />
            </div>

            {/* Adjustment Buttons */}
            <div className="flex justify-around items-center mb-4">
              <button onClick={() => adjustDuration(-10)} className="flex flex-col items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <span className="text-emerald-500 text-2xl font-bold">−</span>
                </div>
                <span className="text-xs font-bold text-gray-400 mt-1">-10</span>
              </button>
              <button onClick={() => adjustDuration(-5)} className="flex flex-col items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <span className="w-7 h-7 flex items-center justify-center text-emerald-500 text-xl">−</span>
                <span className="text-xs font-bold text-gray-400 mt-1">-5</span>
              </button>
              <button onClick={() => adjustDuration(5)} className="flex flex-col items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <span className="w-7 h-7 flex items-center justify-center text-emerald-500 text-xl">+</span>
                <span className="text-xs font-bold text-gray-400 mt-1">+5</span>
              </button>
              <button onClick={() => adjustDuration(10)} className="flex flex-col items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <span className="text-emerald-500 text-2xl font-bold">+</span>
                </div>
                <span className="text-xs font-bold text-gray-400 mt-1">+10</span>
              </button>
            </div>

            {/* Labels */}
            <div className="flex justify-between text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <span>⚡</span>
                <span>Rápido</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⏳</span>
                <span>Prolongado</span>
              </div>
            </div>
          </div>

          {/* Weather API - Mobile Style */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Cloud size={24} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Integración Meteorológica</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedZone.type === 'Indoor' 
                    ? 'Recomendado desactivar para interiores'
                    : 'Previene riegos innecesarios'}
                </p>
              </div>
            </div>

            <div className="space-y-0">
              {/* Toggle: Use Weather API */}
              <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Cloud size={20} className="text-gray-800 dark:text-gray-200" />
                  <span className="font-medium text-gray-800 dark:text-white">Usar Predicción del Clima</span>
                </div>
                <button 
                  onClick={() => setSelectedZone({
                    ...selectedZone,
                    config: { ...selectedZone.config, useWeatherApi: !selectedZone.config.useWeatherApi }
                  })}
                  className={`w-14 h-8 flex items-center rounded-full p-0.5 transition-colors ${
                    selectedZone.config.useWeatherApi ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <div className={`bg-white w-7 h-7 rounded-full shadow-sm transform transition-transform ${
                    selectedZone.config.useWeatherApi ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* Toggle: Respect Rain Forecast */}
              <div className={`flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700 transition-opacity ${
                !selectedZone.config.useWeatherApi ? 'opacity-50' : ''
              }`}>
                <div className="flex items-center gap-3">
                  <CloudRain size={20} className="text-gray-800 dark:text-gray-200" />
                  <span className="font-medium text-gray-800 dark:text-white">Respetar Pronóstico de Lluvia</span>
                </div>
                <button 
                  onClick={() => setSelectedZone({
                    ...selectedZone,
                    config: { ...selectedZone.config, respectRainForecast: !selectedZone.config.respectRainForecast }
                  })}
                  disabled={!selectedZone.config.useWeatherApi}
                  className={`w-14 h-8 flex items-center rounded-full p-0.5 transition-colors ${
                    selectedZone.config.useWeatherApi 
                      ? (selectedZone.config.respectRainForecast ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600')
                      : 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                  }`}
                >
                  <div className={`bg-white w-7 h-7 rounded-full shadow-sm transform transition-transform ${
                    selectedZone.config.respectRainForecast ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* Save Button - Mobile Style */}
          <button 
            onClick={handleSaveZone}
            disabled={saving}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
              saved 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {saving ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Guardando...
              </>
            ) : saved ? (
              <>
                <Check size={20} />
                ¡Configuración Guardada!
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Configuración
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default Configuration;
