import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Droplets, Thermometer, Sun, CloudRain, Activity, Zap, 
  AlertTriangle, ChevronDown, Plus, Trash2, Home, Leaf, Cloud, Lock, Check, Settings
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

// --- COMPONENTES UI (Estilo Mobile) ---

const CircularProgress = ({ value, threshold, hasData }: { value: number | null; threshold: number; hasData: boolean }) => {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const numericValue = typeof value === 'number' ? value : 0;
  const offset = circumference - (numericValue / 100) * circumference;
  const isLow = hasData && numericValue < threshold;

  const strokeColor = !hasData ? '#E5E7EB' : isLow ? '#EF4444' : '#10B981';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-gray-100 dark:stroke-gray-700"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {hasData ? Math.round(numericValue) : '--'}
          {hasData && <span className="text-2xl text-gray-400 font-semibold">%</span>}
        </span>
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
          {hasData ? 'ACTUAL' : 'SIN DATOS'}
        </span>
        <span className={`mt-2 text-xs font-bold ${
          !hasData ? 'text-gray-400' : isLow ? 'text-red-500' : 'text-emerald-500'
        }`}>
          {hasData ? (isLow ? 'CRÍTICO' : 'ÓPTIMO') : 'Esperando...'}
        </span>
      </div>
    </div>
  );
};

const SensorItem = ({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  color, 
  hasData 
}: { 
  label: string; 
  value: number | null; 
  unit: string; 
  icon: any; 
  color: string;
  hasData: boolean;
}) => {
  const colorClasses: Record<string, string> = {
    orange: 'text-orange-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
  };

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-extrabold text-gray-900 dark:text-white">
        {hasData && value !== null ? `${Math.round(value)}${unit}` : '--'}
      </span>
      <Icon size={24} className={hasData ? colorClasses[color] : 'text-gray-300 dark:text-gray-600'} />
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
      <div className="flex items-center justify-center h-80">
        <Activity className="animate-spin h-10 w-10 text-emerald-600" />
      </div>
    );
  }

  // Empty
  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80">
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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Zone Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="relative inline-block" ref={zoneSelectorRef}>
            <button 
              onClick={() => setShowZoneSelector(!showZoneSelector)}
              className="flex items-center gap-2 group"
            >
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{activeZone.name}</h1>
              <ChevronDown 
                size={20} 
                className={`text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-transform ${showZoneSelector ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {/* Zone Selector Dropdown */}
            {showZoneSelector && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mis Zonas</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {zones.map(zone => (
                    <div 
                      key={zone.id} 
                      className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        activeZoneId === zone.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                      }`}
                    >
                      <button
                        onClick={() => { setActiveZoneId(zone.id); setShowZoneSelector(false); }}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          zone.type === 'Indoor' 
                            ? 'bg-blue-100 dark:bg-blue-900/30' 
                            : 'bg-emerald-100 dark:bg-emerald-900/30'
                        }`}>
                          {zone.type === 'Indoor' ? (
                            <Home size={16} className="text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Leaf size={16} className="text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <span className={`block text-sm font-semibold ${
                            activeZoneId === zone.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            {zone.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {zone.type === 'Indoor' ? 'Interior' : zone.type === 'Greenhouse' ? 'Invernadero' : 'Exterior'}
                          </span>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        {activeZoneId === zone.id && (
                          <Check size={16} className="text-emerald-500" />
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => { setShowZoneSelector(false); setShowAddZoneModal(true); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl font-semibold text-sm transition-colors"
                  >
                    <Plus size={18} /> Agregar nueva zona
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Config Button */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Configurar</span>
          </button>
        </div>
        
        <div className="flex items-center gap-4 mt-2">
          {/* Type badge */}
          <div className="type-tag">
            {activeZone.type === 'Indoor' ? <Home size={14} /> : <Leaf size={14} />}
            <span>{activeZone.type === 'Indoor' ? 'Interior' : 'Exterior'}</span>
          </div>
          
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <div className={`status-dot ${isOnline ? 'online' : 'offline'}`}></div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              ESP32 {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card-main p-8">
        {/* Auto Mode Toggle - Top Right */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400">Modo Auto</span>
            <button
              onClick={toggleAutoMode}
              className={`switch ${config.autoMode ? 'active' : ''}`}
            >
              <div className="switch-thumb">
                <Zap size={12} className={config.autoMode ? 'text-emerald-600' : 'text-gray-400'} />
              </div>
            </button>
          </div>
        </div>

        {/* Moisture Circle */}
        <div className="flex justify-center mb-8 pt-4 border-t border-gray-100 dark:border-gray-700">
          <CircularProgress
            value={sensors.soilMoisture}
            threshold={config.moistureThreshold}
            hasData={hasSensorData}
          />
        </div>

        {/* Secondary Sensors */}
        <div className="flex justify-between px-8 py-4 border-b border-gray-100 dark:border-gray-700">
          <SensorItem 
            label="Temperatura" 
            value={sensors.temperature} 
            unit="°" 
            icon={Thermometer} 
            color="orange"
            hasData={hasSensorData}
          />
          <SensorItem 
            label="Tanque" 
            value={sensors.tankLevel ?? sensors.waterLevel} 
            unit="%" 
            icon={Droplets} 
            color={(sensors.tankLevel ?? 0) < 20 ? 'red' : 'blue'}
            hasData={hasSensorData}
          />
          <SensorItem 
            label="Luz" 
            value={sensors.lightLevel} 
            unit="%" 
            icon={Sun} 
            color="yellow"
            hasData={hasSensorData}
          />
        </div>

        {/* Pump Status */}
        <div className="flex items-center justify-center gap-2 my-6">
          <div className={`w-2 h-2 rounded-full ${
            !hasSensorData ? 'bg-gray-300' 
            : pumpRunning ? 'bg-emerald-500' 
            : pumpLocked ? 'bg-red-500' 
            : 'bg-gray-300'
          }`}></div>
          <span className={`text-sm font-semibold ${
            pumpRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {!hasSensorData ? 'Esperando datos del ESP32'
              : pumpRunning ? 'Bomba Activa'
              : pumpLocked ? '🔒 Bomba bloqueada (tanque bajo)'
              : 'Bomba inactiva'}
          </span>
        </div>

        {/* Manual Water Button */}
        <button
          onClick={handleManualWater}
          disabled={pumpRunning || pumpLocked || !hasSensorData}
          className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
            pumpLocked 
              ? 'bg-gray-400 cursor-not-allowed'
              : pumpRunning
                ? 'bg-emerald-500 cursor-default'
                : !hasSensorData
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'btn-primary'
          }`}
        >
          {pumpLocked ? (
            <><Lock size={20} /> Tanque bajo</>
          ) : pumpRunning ? (
            <><Activity size={20} className="animate-spin" /> Regando...</>
          ) : (
            <><Zap size={20} /> Iniciar Riego Manual</>
          )}
        </button>
      </div>

      {/* Weather Forecast Widget */}
      {config.useWeatherApi && (
        <WeatherForecast 
          current={weather} 
          forecast={forecast} 
          loading={weatherLoading}
        />
      )}

      <AddZoneModal isOpen={showAddZoneModal} onClose={() => setShowAddZoneModal(false)} onAdd={handleAddZone} />
      
      <ZoneConfigModal 
        isOpen={showConfigModal} 
        onClose={() => setShowConfigModal(false)} 
        zone={activeZone} 
        onSave={handleSaveZoneConfig}
      />
    </div>
  );
};

export default Dashboard;
