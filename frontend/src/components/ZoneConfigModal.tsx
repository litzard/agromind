import React, { useState, useEffect } from 'react';
import { X, Droplets, Timer, Cloud, CloudRain, Save, Check, Loader2 } from 'lucide-react';
import type { Zone, ZoneConfig } from '../types';

interface ZoneConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: Zone | null;
  onSave: (zoneId: number, config: ZoneConfig) => Promise<void>;
}

const ZoneConfigModal: React.FC<ZoneConfigModalProps> = ({ isOpen, onClose, zone, onSave }) => {
  const [config, setConfig] = useState<ZoneConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (zone) {
      setConfig({ ...zone.config });
      setSaved(false);
    }
  }, [zone]);

  if (!isOpen || !zone || !config) return null;

  const handleSave = async () => {
    if (!config || saving) return;
    
    setSaving(true);
    try {
      await onSave(zone.id, config);
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const adjustThreshold = (delta: number) => {
    const newValue = Math.max(0, Math.min(100, config.moistureThreshold + delta));
    setConfig({ ...config, moistureThreshold: newValue });
  };

  const adjustDuration = (delta: number) => {
    const newValue = Math.max(5, Math.min(120, (config.wateringDuration || 10) + delta));
    setConfig({ ...config, wateringDuration: newValue });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurar Zona</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{zone.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Moisture Threshold */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <Droplets size={20} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Umbral de Humedad</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nivel mínimo para activar riego</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={() => adjustThreshold(-5)}
                className="w-12 h-12 bg-white dark:bg-gray-600 rounded-xl flex items-center justify-center text-2xl font-bold text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors shadow-sm"
              >
                −
              </button>
              <div className="text-center">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                  {config.moistureThreshold}
                </span>
                <span className="text-xl text-gray-400 ml-1">%</span>
              </div>
              <button 
                onClick={() => adjustThreshold(5)}
                className="w-12 h-12 bg-white dark:bg-gray-600 rounded-xl flex items-center justify-center text-2xl font-bold text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors shadow-sm"
              >
                +
              </button>
            </div>

            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${config.moistureThreshold}%` }}
              />
            </div>
          </div>

          {/* Watering Duration */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Timer size={20} className="text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Tiempo de Riego</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Duración del riego automático</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={() => adjustDuration(-5)}
                className="w-12 h-12 bg-white dark:bg-gray-600 rounded-xl flex items-center justify-center text-2xl font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
              >
                −
              </button>
              <div className="text-center">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                  {config.wateringDuration || 10}
                </span>
                <span className="text-xl text-gray-400 ml-1">seg</span>
              </div>
              <button 
                onClick={() => adjustDuration(5)}
                className="w-12 h-12 bg-white dark:bg-gray-600 rounded-xl flex items-center justify-center text-2xl font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Weather Toggles */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <Cloud size={20} className="text-orange-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Integración Clima</h3>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <Cloud size={18} className="text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Usar Predicción del Clima</span>
              </div>
              <button 
                onClick={() => setConfig({ ...config, useWeatherApi: !config.useWeatherApi })}
                className={`w-12 h-7 flex items-center rounded-full p-0.5 transition-colors ${
                  config.useWeatherApi ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform ${
                  config.useWeatherApi ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className={`flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-600 transition-opacity ${
              !config.useWeatherApi ? 'opacity-50' : ''
            }`}>
              <div className="flex items-center gap-2">
                <CloudRain size={18} className="text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Respetar Pronóstico Lluvia</span>
              </div>
              <button 
                onClick={() => setConfig({ ...config, respectRainForecast: !config.respectRainForecast })}
                disabled={!config.useWeatherApi}
                className={`w-12 h-7 flex items-center rounded-full p-0.5 transition-colors ${
                  config.useWeatherApi 
                    ? (config.respectRainForecast ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600')
                    : 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                }`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform ${
                  config.respectRainForecast ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              saved 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {saving ? (
              <><Loader2 size={20} className="animate-spin" /> Guardando...</>
            ) : saved ? (
              <><Check size={20} /> ¡Guardado!</>
            ) : (
              <><Save size={20} /> Guardar Configuración</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoneConfigModal;
