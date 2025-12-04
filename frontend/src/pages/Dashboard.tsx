import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Droplets, Thermometer, Activity, Zap, Cloud,
  ChevronDown, Plus, Trash2, Home, Leaf, Lock, Check, Settings
} from 'lucide-react';
import { getExtendedForecast, getUserLocation, type WeatherData } from '../services/weatherService';
import type { DailyForecast } from '../types';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';
import type { Zone, ZoneSensors, ZoneStatus, ZoneConfig } from '../types';
import esp32Service from '../services/esp32Service';
import AddZoneModal from '../components/AddZoneModal';
import ZoneConfigModal from '../components/ZoneConfigModal';
import WeatherForecast from '../components/WeatherForecast';
import AnimatedBackground from '../components/AnimatedBackground';

// --- VALORES POR DEFECTO ---
const DEFAULT_SENSORS: ZoneSensors = {
  soilMoisture: null,
  temperature: null,
  humidity: null,
  lightLevel: null,
  tankLevel: null,
  waterLevel: null,
};

const DEFAULT_STATUS: ZoneStatus = {
  pump: 'OFF',
  lastWatered: null,
  connection: 'UNKNOWN',
  nextScheduledWatering: null,
  lastUpdate: null,
  hasSensorData: false,
};

const DEFAULT_CONFIG: ZoneConfig = {
  autoMode: false,
  moistureThreshold: 30,
  wateringDuration: 10,
  useWeatherApi: false,
  respectRainForecast: false,
};

// --- COMPONENTES UI ---

const MoistureGauge = ({ value, threshold, hasData }: { value: number | null; threshold: number; hasData: boolean }) => {
  const numericValue = typeof value === 'number' ? value : 0;
  const isLow = hasData && numericValue < threshold;
  const percentage = Math.min(100, Math.max(0, numericValue));

  return (
    <div className="relative">
      {/* Background bar */}
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ${
            !hasData ? 'bg-gray-300 dark:bg-gray-600' : isLow ? 'bg-red-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${hasData ? percentage : 0}%` }}
        />
      </div>
      {/* Threshold marker */}
      {hasData && (
        <div 
          className="absolute top-0 w-0.5 h-4 bg-gray-900 dark:bg-white opacity-50"
          style={{ left: `${threshold}%` }}
        />
      )}
    </div>
  );
};

// --- DASHBOARD PRINCIPAL ---
const Dashboard: React.FC = () => {
  const { user, addNotification } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<number | null>(null);
  const [loadingZones, setLoadingZones] = useState(true);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showZoneSelector, setShowZoneSelector] = useState(false);
  const [manualWatering, setManualWatering] = useState(false);
  
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  const zoneSelectorRef = useRef<HTMLDivElement>(null);

  const activeZone = useMemo(() => zones.find(z => z.id === activeZoneId), [zones, activeZoneId]);
  
  const sensors = activeZone?.sensors || DEFAULT_SENSORS;
  const status = activeZone?.status || DEFAULT_STATUS;
  const config = activeZone?.config || DEFAULT_CONFIG;
  const hasSensorData = Boolean(status.hasSensorData || status.lastUpdate);
  const isOnline = status.connection === 'ONLINE';

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (zoneSelectorRef.current && !zoneSelectorRef.current.contains(event.target as Node)) {
        setShowZoneSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar zonas
  const loadZones = useCallback(async () => {
    if (!user?.id) {
      setLoadingZones(false);
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${user.id}`);
      if (!response.ok) throw new Error('Error al cargar zonas');

      const data = await response.json();
      
      setZones(data.map((z: any) => ({
        ...z,
        sensors: { ...DEFAULT_SENSORS, ...z.sensors },
        status: { ...DEFAULT_STATUS, ...z.status },
        config: { ...DEFAULT_CONFIG, ...z.config },
      })));

      if (data.length > 0 && !activeZoneId) {
        setActiveZoneId(data[0].id);
      }
    } catch (error) {
      console.error('Error cargando zonas:', error);
    } finally {
      setLoadingZones(false);
    }
  }, [user?.id, activeZoneId]);

  useEffect(() => {
    loadZones();
    const interval = setInterval(loadZones, 5000);
    return () => clearInterval(interval);
  }, [loadZones]);

  // Guardar ubicación del usuario en las zonas (para horarios)
  useEffect(() => {
    const saveLocationToZones = async () => {
      if (zones.length === 0 || !user?.id) return;
      
      try {
        const location = await getUserLocation();
        
        // Solo actualizar zonas que no tienen ubicación guardada
        for (const zone of zones) {
          const zoneConfig = zone.config as any;
          if (!zoneConfig.location) {
            const updatedConfig = { ...zoneConfig, location };
            await fetch(`${API_CONFIG.BASE_URL}/zones/${zone.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ config: updatedConfig }),
            });
          }
        }
      } catch (err) {
        console.log('No se pudo obtener ubicación para horarios');
      }
    };
    
    // Ejecutar solo una vez al cargar
    const timer = setTimeout(saveLocationToZones, 2000);
    return () => clearTimeout(timer);
  }, [zones.length, user?.id]);

  // Polling ESP32
  useEffect(() => {
    if (!activeZone) return;

    esp32Service.startPolling(activeZone.id, (zoneData) => {
      setZones(prev => prev.map(z =>
        z.id === zoneData.id
          ? { ...z, sensors: { ...z.sensors, ...zoneData.sensors }, status: { ...z.status, ...zoneData.status }, config: { ...z.config, ...zoneData.config } }
          : z
      ));
    }, 5000);

    return () => { esp32Service.stopPolling(activeZone.id); };
  }, [activeZone?.id]);

  // Cargar clima extendido
  useEffect(() => {
    const loadWeather = async () => {
      if (!activeZone || !config.useWeatherApi) {
        setWeather(null);
        setForecast([]);
        return;
      }

      setWeatherLoading(true);
      try {
        let location;
        try { location = await getUserLocation(); } 
        catch { location = { lat: 19.4326, lon: -99.1332 }; }
        
        const data = await getExtendedForecast(location.lat, location.lon);
        setWeather(data.current);
        setForecast(data.daily);
      } catch (err: any) {
        setWeather(null);
        setForecast([]);
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeather();
    const interval = setInterval(loadWeather, 600000);
    return () => clearInterval(interval);
  }, [activeZone?.id, config.useWeatherApi]);

  // Handlers
  const handleManualWater = async () => {
    if (!activeZone || manualWatering) return;
    
    const tankLevel = sensors.tankLevel ?? 0;
    if (tankLevel <= 5) {
      addNotification('Tanque Vacío', 'No hay suficiente agua.', 'error');
      return;
    }

    if (status.pump === 'ON' || status.pump === 'LOCKED') return;

    try {
      setManualWatering(true);
      setZones(prev => prev.map(z => z.id === activeZone.id ? { ...z, status: { ...z.status, pump: 'ON' } } : z));

      const success = await esp32Service.togglePump(activeZone.id, true);
      
      if (!success) {
        setZones(prev => prev.map(z => z.id === activeZone.id ? { ...z, status: { ...z.status, pump: 'OFF' } } : z));
        throw new Error('No se pudo activar la bomba');
      }

      addNotification('Riego Iniciado', `Regando ${activeZone.name}...`, 'info');

      const duration = (config.wateringDuration || 10) * 1000;
      setTimeout(async () => {
        await esp32Service.togglePump(activeZone.id, false);
        setZones(prev => prev.map(z => z.id === activeZone.id ? { ...z, status: { ...z.status, pump: 'OFF' } } : z));
        setManualWatering(false);
      }, duration);

    } catch (error) {
      addNotification('Error', 'No se pudo iniciar el riego', 'error');
      setManualWatering(false);
    }
  };

  const handleAddZone = async (zoneData: { name: string; type: 'Outdoor' | 'Indoor' | 'Greenhouse' }) => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: zoneData.name,
          type: zoneData.type,
          sensors: DEFAULT_SENSORS,
          status: DEFAULT_STATUS,
          config: { ...DEFAULT_CONFIG, useWeatherApi: zoneData.type === 'Outdoor', respectRainForecast: zoneData.type === 'Outdoor' }
        })
      });

      if (!response.ok) throw new Error('Error al crear zona');
      const createdZone = await response.json();
      
      setZones(prev => [...prev, { ...createdZone, sensors: { ...DEFAULT_SENSORS, ...createdZone.sensors }, status: { ...DEFAULT_STATUS, ...createdZone.status }, config: { ...DEFAULT_CONFIG, ...createdZone.config } }]);
      setActiveZoneId(createdZone.id);
      addNotification('Zona Creada', `${zoneData.name} agregada.`, 'info');
    } catch (error) {
      addNotification('Error', 'No se pudo crear la zona.', 'error');
    }
  };

  const handleDeleteZone = async (zoneId: number) => {
    if (!confirm('¿Eliminar esta zona?')) return;
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${zoneId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');

      setZones(prev => {
        const updated = prev.filter(z => z.id !== zoneId);
        if (activeZoneId === zoneId && updated.length > 0) setActiveZoneId(updated[0].id);
        return updated;
      });
      setShowZoneSelector(false);
      addNotification('Zona Eliminada', 'La zona fue eliminada.', 'info');
    } catch (error) {
      addNotification('Error', 'No se pudo eliminar.', 'error');
    }
  };

  const toggleAutoMode = async () => {
    if (!activeZone) return;
    try {
      const newAutoMode = !config.autoMode;
      const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${activeZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { ...config, autoMode: newAutoMode } })
      });

      if (response.ok) {
        setZones(prev => prev.map(z => z.id === activeZone.id ? { ...z, config: { ...z.config, autoMode: newAutoMode } } : z));
      }
    } catch (error) {
      addNotification('Error', 'No se pudo cambiar el modo', 'error');
    }
  };

  const handleSaveZoneConfig = async (zoneId: number, newConfig: ZoneConfig) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${zoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig })
      });

      if (!response.ok) throw new Error('Error al guardar');

      setZones(prev => prev.map(z => z.id === zoneId ? { ...z, config: newConfig } : z));
      addNotification('Configuración Guardada', 'Los cambios se aplicaron correctamente.', 'info');
    } catch (error) {
      addNotification('Error', 'No se pudo guardar la configuración.', 'error');
      throw error;
    }
  };

  // Loading
  if (loadingZones) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <Activity className="animate-spin h-10 w-10 text-emerald-600" />
      </div>
    );
  }

  // Empty
  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <Leaf size={80} className="text-emerald-300 mb-6" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No tienes zonas configuradas</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Crea tu primera zona para comenzar</p>
        <button 
          onClick={() => setShowAddZoneModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} /> Agregar Zona
        </button>
        <AddZoneModal isOpen={showAddZoneModal} onClose={() => setShowAddZoneModal(false)} onAdd={handleAddZone} />
      </div>
    );
  }

  if (!activeZone) {
    return <div className="flex items-center justify-center h-80"><Activity className="animate-spin h-10 w-10 text-emerald-600" /></div>;
  }

  const pumpRunning = status.pump === 'ON' || manualWatering;
  const pumpLocked = status.pump === 'LOCKED';
  const moistureValue = sensors.soilMoisture ?? 0;
  const isLowMoisture = hasSensorData && moistureValue < config.moistureThreshold;

  return (
    <>
      <AnimatedBackground />
      <div className="space-y-6 animate-fade-in relative z-10">
      
      {/* Header con selector de zona */}
      <div className="flex items-center justify-between">
        <div className="relative" ref={zoneSelectorRef}>
          <button 
            onClick={() => setShowZoneSelector(!showZoneSelector)}
            className="flex items-center gap-3 group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              activeZone.type === 'Indoor' 
                ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
            }`}>
              {activeZone.type === 'Indoor' ? (
                <Home size={28} className="text-white" />
              ) : (
                <Leaf size={28} className="text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{activeZone.name}</h1>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${showZoneSelector ? 'rotate-180' : ''}`} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {isOnline ? 'ESP32 conectado' : 'Sin conexión'}
                </span>
              </div>
            </div>
          </button>
          
          {/* Dropdown de zonas */}
          {showZoneSelector && (
            <div className="absolute top-full left-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase">Mis Zonas</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {zones.map(zone => (
                  <div 
                    key={zone.id} 
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                      activeZoneId === zone.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                    }`}
                  >
                    <button
                      onClick={() => { setActiveZoneId(zone.id); setShowZoneSelector(false); }}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        zone.type === 'Indoor' 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : 'bg-emerald-100 dark:bg-emerald-900/30'
                      }`}>
                        {zone.type === 'Indoor' ? <Home size={18} className="text-blue-600" /> : <Leaf size={18} className="text-emerald-600" />}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{zone.name}</span>
                    </button>
                    {activeZoneId === zone.id && <Check size={18} className="text-emerald-500" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone.id); }}
                      className="ml-2 p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setShowZoneSelector(false); setShowAddZoneModal(true); }}
                className="w-full p-3 flex items-center justify-center gap-2 text-emerald-600 font-medium border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <Plus size={18} /> Nueva Zona
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Settings size={22} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Layout Principal - 2 columnas en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda - Panel de Humedad */}
        <div className="lg:col-span-2 space-y-6">
          {/* Panel Principal - Humedad */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 lg:p-8 text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-24 -translate-x-24" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Droplets size={24} />
                  <span className="font-semibold">Humedad del Suelo</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm opacity-80">Modo Auto</span>
                  <button
                    onClick={toggleAutoMode}
                    className={`relative w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${config.autoMode ? 'bg-white' : 'bg-white/30'}`}
                  >
                    <div className={`w-6 h-6 rounded-full transition-transform duration-200 ${
                      config.autoMode ? 'translate-x-5 bg-emerald-600' : 'translate-x-0 bg-white'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-7xl lg:text-8xl font-black tracking-tight">
                    {hasSensorData ? Math.round(moistureValue) : '--'}
                    <span className="text-3xl lg:text-4xl opacity-70">%</span>
                  </div>
                  <div className={`text-sm font-medium mt-1 ${isLowMoisture ? 'text-red-200' : 'opacity-80'}`}>
                    {!hasSensorData ? 'Esperando datos...' : isLowMoisture ? '⚠ Necesita riego' : '✓ Nivel óptimo'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-70">Umbral</div>
                  <div className="text-2xl lg:text-3xl font-bold">{config.moistureThreshold}%</div>
                </div>
              </div>

              <MoistureGauge value={sensors.soilMoisture} threshold={config.moistureThreshold} hasData={hasSensorData} />
            </div>
          </div>

          {/* Botón de Riego */}
          <button
            onClick={handleManualWater}
            disabled={pumpRunning || pumpLocked || !hasSensorData}
            className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              pumpLocked 
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                : pumpRunning
                  ? 'bg-emerald-500 text-white'
                  : !hasSensorData
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl'
            }`}
          >
            {pumpLocked ? (
              <><Lock size={22} /> Tanque vacío</>
            ) : pumpRunning ? (
              <><Activity size={22} className="animate-spin" /> Regando...</>
            ) : (
              <><Zap size={22} /> Regar Ahora</>
            )}
          </button>

          {/* Estado de la bomba */}
          {hasSensorData && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className={`w-2 h-2 rounded-full ${pumpRunning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
              {pumpRunning ? 'Bomba activa' : status.lastWatered ? `Último riego: ${status.lastWatered}` : 'Bomba inactiva'}
            </div>
          )}
        </div>

        {/* Columna Derecha - Sensores */}
        <div className="space-y-4">
          {/* Temperatura */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                hasSensorData ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Thermometer size={28} className={hasSensorData ? 'text-orange-500' : 'text-gray-400'} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Temperatura</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {hasSensorData && sensors.temperature !== null ? `${Math.round(sensors.temperature)}°C` : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Tanque */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                (sensors.tankLevel ?? 0) < 20 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : hasSensorData ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Droplets size={28} className={
                  (sensors.tankLevel ?? 0) < 20 ? 'text-red-500' : hasSensorData ? 'text-blue-500' : 'text-gray-400'
                } />
              </div>
              <div className="flex-1">
                <div className={`text-sm ${(sensors.tankLevel ?? 0) < 20 ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {(sensors.tankLevel ?? 0) < 20 ? '⚠ Nivel bajo' : 'Nivel del Tanque'}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {hasSensorData && sensors.tankLevel !== null ? `${Math.round(sensors.tankLevel)}%` : '--'}
                </div>
              </div>
            </div>
            {hasSensorData && sensors.tankLevel !== null && (
              <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${(sensors.tankLevel ?? 0) < 20 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${sensors.tankLevel}%` }}
                />
              </div>
            )}
          </div>

          {/* Clima */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                weather ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Cloud size={28} className={weather ? 'text-cyan-500' : 'text-gray-400'} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {weather?.description || 'Clima Exterior'}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {weather ? `${Math.round(weather.temp)}°C` : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Info de conexión */}
          
        </div>
      </div>

      {/* Pronóstico del clima */}
      {config.useWeatherApi && (
        <WeatherForecast 
          current={weather} 
          forecast={forecast} 
          loading={weatherLoading}
        />
      )}

      <AddZoneModal isOpen={showAddZoneModal} onClose={() => setShowAddZoneModal(false)} onAdd={handleAddZone} />
      <ZoneConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} zone={activeZone} onSave={handleSaveZoneConfig} />
      </div>
    </>
  );
};

export default Dashboard;
