import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Droplets, Thermometer, Sun, CloudRain, Activity, Zap, 
  AlertTriangle, MoreVertical, Plus, Trash2
} from 'lucide-react';
import { getLocalWeather, getUserLocation, type WeatherData } from '../services/weatherService';
import { useAuth } from '../context/AuthContext';
import AddZoneModal from '../components/AddZoneModal';
import { API_URL } from '../services/api';

// --- 1. DEFINICIÓN DE TIPOS (TypeScript Senior) ---

interface IrrigationConfig {
  moistureThreshold: number; 
  wateringDuration: number; 
  autoMode: boolean;
  respectRainForecast: boolean;
  useWeatherApi: boolean; // Ahora por zona
}

interface Zone {
  id: string;
  name: string;
  type: 'Outdoor' | 'Indoor' | 'Greenhouse';
  sensors: {
    soilMoisture: number;
    tankLevel: number;
    temperature: number;
    humidity: number;
    lightLevel: number;
  };
  status: {
    pump: 'ON' | 'OFF' | 'LOCKED';
    connection: 'ONLINE' | 'OFFLINE';
    lastWatered: string;
  };
  config: IrrigationConfig;
}

// --- 2. DATOS INICIALES (Mocks) ---

const INITIAL_ZONES: Zone[] = [
  {
    id: 'z1',
    name: 'Jardín Principal',
    type: 'Outdoor',
    sensors: { soilMoisture: 45, tankLevel: 80, temperature: 24, humidity: 60, lightLevel: 90 },
    status: { pump: 'OFF', connection: 'ONLINE', lastWatered: '08:30 AM' },
    config: { moistureThreshold: 30, wateringDuration: 10, autoMode: true, respectRainForecast: true, useWeatherApi: true }
  },
  {
    id: 'z2',
    name: 'Invernadero',
    type: 'Greenhouse',
    sensors: { soilMoisture: 20, tankLevel: 15, temperature: 28, humidity: 80, lightLevel: 40 },
    status: { pump: 'OFF', connection: 'ONLINE', lastWatered: 'Ayer 06:00 PM' },
    config: { moistureThreshold: 40, wateringDuration: 15, autoMode: true, respectRainForecast: false, useWeatherApi: false }
  }
];

// --- 3. COMPONENTES UI REUTILIZABLES ---

const CircularProgress = ({ value, color, label, sublabel }: { value: number; color: string; label: string; sublabel?: string }) => {
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-48 h-48 bg-gray-50 dark:bg-gray-700 rounded-full shadow-inner"></div>
      <svg className="transform -rotate-90 w-56 h-56 relative z-10">
        <circle cx="112" cy="112" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeLinecap="round" className="text-gray-100 dark:text-gray-600" />
        <circle
          cx="112"
          cy="112"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out drop-shadow-md"
        />
      </svg>
      <div className="absolute flex flex-col items-center z-20">
        <span className="text-5xl font-bold text-gray-800 dark:text-white tracking-tighter">{Math.round(value)}<span className="text-2xl text-gray-400 dark:text-gray-500">%</span></span>
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{label}</span>
        {sublabel && (
          <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${sublabel === 'CRÍTICO' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

const TankVisual = ({ level }: { level: number }) => (
  <div className="h-56 w-24 bg-gray-100 dark:bg-gray-700 rounded-4xl relative overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl dark:shadow-none ml-4">
    <div className="absolute right-3 top-10 w-2 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    <div className="absolute right-3 top-1/2 w-4 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    <div className="absolute right-3 bottom-10 w-2 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    <div 
      className={`absolute bottom-0 w-full transition-all duration-1000 ease-in-out ${level < 20 ? 'bg-linear-to-t from-red-500 to-red-400' : 'bg-linear-to-t from-blue-600 to-cyan-400'}`}
      style={{ height: `${level}%` }}
    >
       <div className="w-full h-2 bg-white/30 absolute top-0"></div>
    </div>
    <div className="absolute w-full text-center bottom-4 z-10">
      <span className="text-white font-bold text-xl drop-shadow-md">{Math.round(level)}%</span>
    </div>
  </div>
);

const WeatherWidget = ({ weather, loading, error }: { weather: WeatherData, loading: boolean, error: string | null }) => (
  <div 
    className="cursor-pointer group relative overflow-hidden bg-linear-to-br from-sky-400 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:scale-[1.02]"
  >
    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
    
    {loading ? (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <Activity className="animate-spin mb-2" />
        <span className="text-sm">Cargando clima...</span>
      </div>
    ) : error ? (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center">
        <AlertTriangle className="mb-2 opacity-80" />
        <span className="text-sm font-medium">{error}</span>
        <span className="text-xs opacity-70 mt-1">Intenta más tarde</span>
      </div>
    ) : (
      <>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <span className="text-xs font-bold uppercase tracking-wider">{weather.cityName || 'Local'}</span>
            </div>
            <p className="text-4xl font-bold">{weather.temp}°</p>
            <p className="text-sm font-medium opacity-90 mt-1 capitalize">{weather.description}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner">
            {weather.condition === 'Rain' ? <CloudRain size={28} className="animate-bounce-short" /> : <Sun size={28} className="animate-spin-slow" />}
          </div>
        </div>
        <div className="mt-6 relative z-10">
           <div className="flex justify-between text-xs font-medium mb-2 opacity-80">
             <span>Probabilidad Lluvia</span>
             <span>{weather.rainProbability}%</span>
           </div>
           <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
             <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${weather.rainProbability}%` }}></div>
           </div>
        </div>
      </>
    )}
  </div>
);

const Dashboard: React.FC = () => {
  // Estados Globales
  const { user, addNotification } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string>('');
  const [loadingZones, setLoadingZones] = useState(true);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  
  // Estado del Clima Real
  const [weather, setWeather] = useState<WeatherData>({ 
    condition: 'Sunny', 
    temp: 0, 
    rainProbability: 0, 
    description: 'Esperando datos...',
    cityName: ''
  });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Computar Zona Activa
  const activeZone = useMemo(() => zones.find(z => z.id === activeZoneId) || zones[0], [zones, activeZoneId]);

  // --- CARGAR ZONAS DESDE LA BASE DE DATOS ---
  useEffect(() => {
    const loadZones = async () => {
      if (!user?.id) {
        setLoadingZones(false);
        return;
      }
      
      try {
        setLoadingZones(true);
        const response = await fetch(`${API_URL}/zones/${user.id}`);
        
        if (!response.ok) {
          console.error('Error al cargar zonas, usando datos iniciales');
          setZones(INITIAL_ZONES);
          setActiveZoneId('z1');
          return;
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
          // Si no hay zonas, usar las iniciales
          setZones(INITIAL_ZONES);
          setActiveZoneId('z1');
        } else {
          setZones(data.map((z: any) => ({
            id: z.id.toString(),
            name: z.name,
            type: z.type,
            sensors: z.sensors,
            status: z.status,
            config: z.config
          })));
          
          if (!activeZoneId) {
            setActiveZoneId(data[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Error cargando zonas:', error);
        // Cargar zonas de prueba si falla
        setZones(INITIAL_ZONES);
        setActiveZoneId('z1');
      } finally {
        setLoadingZones(false);
      }
    };

    loadZones();

    // Polling automático cada 3 segundos para datos en tiempo real
    const pollInterval = setInterval(() => {
      if (user?.id) {
        loadZones();
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [user?.id, activeZoneId]);

  // --- CARGAR CLIMA CUANDO CAMBIA LA ZONA ACTIVA ---
  useEffect(() => {
    const loadWeather = async () => {
      if (!activeZone) return;

      // Solo cargar clima si la zona tiene habilitado el API de clima
      if (activeZone.config.useWeatherApi) {
        setWeatherLoading(true);
        setWeatherError(null);
        try {
          let location;
          try {
            location = await getUserLocation();
          } catch (locError) {
            console.warn("No se pudo obtener ubicación, usando default (CDMX)", locError);
            location = { lat: 19.4326, lon: -99.1332 }; // Fallback a CDMX
          }
          
          // API Key hardcoded por requerimiento
          const API_KEY = '49f682ec8fdc97009a3e5f93b5c6a678';
          const data = await getLocalWeather(location.lat, location.lon, API_KEY);
          setWeather(data);
        } catch (err: any) {
          console.error(err);
          // Mensaje más amigable si es error de API (401, 404)
          if (err.message && err.message.includes('401')) {
             setWeatherError('API Key inválida o no activada');
          } else {
             setWeatherError('Error de conexión');
          }
        } finally {
          setWeatherLoading(false);
        }
      } else {
        setWeatherError('API Desactivada para esta zona');
      }
    };

    loadWeather();
    // Recargar clima cada 10 minutos si está activo
    const interval = setInterval(loadWeather, 600000);
    return () => clearInterval(interval);
  }, [activeZone?.id, activeZone?.config.useWeatherApi]);

  // --- SIMULADOR DE IOT ---
  const lastNotificationRef = useRef<{[key: string]: number}>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setZones(prev => prev.map(z => {
        // 1. Simulamos fluctuaciones de sensores
        let { soilMoisture, tankLevel, temperature } = z.sensors;
        let { pump } = z.status;
        
        temperature = parseFloat((temperature + (Math.random() - 0.5) * 0.1).toFixed(1));

        // Si la bomba prende, la humedad sube y el tanque baja
        if (pump === 'ON') {
          soilMoisture = Math.min(100, soilMoisture + 2.5);
          tankLevel = Math.max(0, tankLevel - 0.5);
        } else {
          // Secado natural
          soilMoisture = Math.max(0, soilMoisture - 0.15);
        }

        // 2. Lógica de Controladores (El cerebro del sistema)
        let nextPump = pump;
        
        // REGLA DE SEGURIDAD: Tanque Vacío
        if (tankLevel <= 5) {
           if (pump !== 'LOCKED') {
             nextPump = 'LOCKED';
             // Notificar bloqueo
             const now = Date.now();
             if (!lastNotificationRef.current[`${z.id}-locked`] || now - lastNotificationRef.current[`${z.id}-locked`] > 60000) {
                addNotification(`¡Alerta en ${z.name}!`, 'El tanque de agua está vacío. Bomba bloqueada.', 'error');
                lastNotificationRef.current[`${z.id}-locked`] = now;
             }
           }
        } else if (pump === 'LOCKED' && tankLevel > 10) {
           nextPump = 'OFF'; // Desbloquear si se rellena
        }
        
        // REGLA DE AUTOMATIZACIÓN
        if (z.config.autoMode && nextPump !== 'LOCKED') {
          // Usamos el clima real si está disponible, sino asumimos que no llueve para la lógica automática básica
          const isRaining = z.type === 'Outdoor' && z.config.respectRainForecast && weather.condition === 'Rain';
          
          // Encender
          if (soilMoisture < z.config.moistureThreshold && !isRaining && pump === 'OFF') {
             nextPump = 'ON';
             // Notificar riego
             const now = Date.now();
             if (!lastNotificationRef.current[`${z.id}-watering`] || now - lastNotificationRef.current[`${z.id}-watering`] > 300000) { // 5 min debounce
                addNotification(`Riego iniciado en ${z.name}`, `Humedad baja detectada (${Math.round(soilMoisture)}%).`, 'info');
                lastNotificationRef.current[`${z.id}-watering`] = now;
             }
          } 
          // Apagar (Histéresis +25%)
          else if (soilMoisture > (z.config.moistureThreshold + 25) && pump === 'ON') {
             nextPump = 'OFF';
          }
        }

        return { 
          ...z, 
          sensors: { ...z.sensors, soilMoisture, tankLevel, temperature }, 
          status: { ...z.status, pump: nextPump } 
        };
      }));
    }, 1000); // Actualiza cada segundo

    return () => clearInterval(interval);
  }, [weather, addNotification]);

  // Handlers
  const handleManualWater = () => {
    if (activeZone.sensors.tankLevel > 5 && activeZone.status.pump !== 'LOCKED') {
      updateZoneStatus(activeZoneId, 'ON');
      setTimeout(() => updateZoneStatus(activeZoneId, 'OFF'), 3000);
    }
  };

  const updateZoneStatus = (id: string, s: any) => 
    setZones(prev => prev.map(z => z.id === id ? { ...z, status: { ...z.status, pump: s } } : z));

  const handleRefill = () => 
    setZones(prev => prev.map(z => z.id === activeZoneId ? { ...z, sensors: { ...z.sensors, tankLevel: 100 }, status: { ...z.status, pump: 'OFF' } } : z));

  const handleAddZone = async (zoneData: { name: string; type: 'Outdoor' | 'Indoor' | 'Greenhouse' }) => {
    if (!user?.id) return;
    
    try {
      const newZone = {
        userId: user.id,
        name: zoneData.name,
        type: zoneData.type,
        sensors: { soilMoisture: 50, tankLevel: 100, temperature: 22, humidity: 60, lightLevel: 70 },
        status: { pump: 'OFF', connection: 'ONLINE', lastWatered: 'Nunca' },
        config: { 
          moistureThreshold: 30, 
          wateringDuration: 10, 
          autoMode: true, 
          respectRainForecast: zoneData.type === 'Outdoor', // Solo outdoor respeta lluvia por defecto
          useWeatherApi: zoneData.type === 'Outdoor' // Solo outdoor usa clima por defecto
        }
      };

      const response = await fetch(`${API_URL}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newZone)
      });

      if (!response.ok) throw new Error('Error al crear zona');

      const createdZone = await response.json();
      
      const formattedZone: Zone = {
        id: createdZone.id.toString(),
        name: createdZone.name,
        type: createdZone.type,
        sensors: createdZone.sensors,
        status: createdZone.status,
        config: createdZone.config
      };

      setZones(prev => [...prev, formattedZone]);
      setActiveZoneId(formattedZone.id);
      addNotification('Zona Creada', `${zoneData.name} se ha agregado exitosamente.`, 'info');
    } catch (error) {
      console.error('Error al crear zona:', error);
      addNotification('Error', 'No se pudo crear la zona. Intenta de nuevo.', 'error');
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta zona?')) return;
    
    try {
      const response = await fetch(`${API_URL}/zones/${zoneId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar zona');

      setZones(prev => prev.filter(z => z.id !== zoneId));
      
      // Si eliminamos la zona activa, cambiar a la primera disponible
      if (activeZoneId === zoneId) {
        const remainingZones = zones.filter(z => z.id !== zoneId);
        if (remainingZones.length > 0) {
          setActiveZoneId(remainingZones[0].id);
        }
      }

      addNotification('Zona Eliminada', 'La zona se ha eliminado correctamente.', 'info');
    } catch (error) {
      console.error('Error al eliminar zona:', error);
      addNotification('Error', 'No se pudo eliminar la zona. Intenta de nuevo.', 'error');
    }
  };

  // Mostrar loading mientras carga
  if (loadingZones) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando zonas...</p>
        </div>
      </div>
    );
  }

  if (!activeZone || zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No tienes zonas configuradas</p>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Crear Primera Zona
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Header con Selector de Zona */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
         <div>
           <div className="flex items-center gap-3 mb-2">
             <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{activeZone.name}</h2>
             {/* Zone Selector */}
             <div className="relative group pb-2">
                <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 transition-colors">
                    <MoreVertical size={20} />
                </button>
                <div className="absolute left-0 top-full mt-0 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-none border border-gray-100 dark:border-gray-700 hidden group-hover:block z-50">
                    <div className="p-2">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase px-2 py-1">Mis Zonas</p>
                        {zones.map(z => (
                            <div key={z.id} className="flex items-center gap-1">
                              <button 
                                  onClick={() => setActiveZoneId(z.id)}
                                  className={`flex-1 text-left px-2 py-2 rounded-lg text-sm transition-colors ${activeZoneId === z.id ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                              >
                                  {z.name}
                              </button>
                              {zones.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteZone(z.id);
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Eliminar zona"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                        ))}
                        <button 
                          onClick={() => setShowAddZoneModal(true)}
                          className="w-full text-left px-2 py-2 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors mt-1"
                        >
                            <Plus size={14} /> Nueva Zona
                        </button>
                    </div>
                </div>
             </div>
           </div>
           <p className="text-gray-400 dark:text-gray-500 font-medium flex items-center gap-2 text-sm">
             <span className={`w-2 h-2 rounded-full ${activeZone.status.connection === 'ONLINE' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
             Sistema {activeZone.status.connection}
           </p>
         </div>
      </div>

      {/* Alerta Flotante */}
      {activeZone.status.pump === 'LOCKED' && (
        <div className="bg-white dark:bg-gray-800 border-l-4 border-red-500 rounded-r-xl p-4 shadow-md dark:shadow-none flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" />
            <div>
               <p className="font-bold text-gray-900 dark:text-white">¡Tanque Vacío!</p>
               <p className="text-sm text-gray-500 dark:text-gray-400">El sistema se ha pausado por seguridad.</p>
            </div>
          </div>
          <button onClick={handleRefill} className="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50">
            Rellenar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Izquierda (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
           {/* Tarjeta Héroe */}
           <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6 relative z-10">
                 <div className="flex items-center gap-3">
                   <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-500 dark:text-emerald-400"><Droplets size={20}/></div>
                   <span className="font-bold text-gray-400 dark:text-gray-500 uppercase text-xs tracking-wider">Humedad del Suelo</span>
                 </div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-12 relative z-10">
                 <CircularProgress 
                   value={activeZone.sensors.soilMoisture} 
                   color={activeZone.sensors.soilMoisture < activeZone.config.moistureThreshold ? '#F87171' : '#34D399'} 
                   label="Actual"
                   sublabel={activeZone.sensors.soilMoisture < activeZone.config.moistureThreshold ? 'CRÍTICO' : 'OPTIMO'}
                 />
                 <div className="grid grid-cols-2 gap-6 w-full md:w-auto">
                    <div className="space-y-1">
                       <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Umbral Riego</span>
                       <p className="text-2xl font-bold text-gray-800 dark:text-white">{activeZone.config.moistureThreshold}%</p>
                    </div>
                    <div className="space-y-1">
                       <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Último Riego</span>
                       <p className="text-lg font-bold text-gray-800 dark:text-white">{activeZone.status.lastWatered}</p>
                    </div>
                    <div className="col-span-2 pt-4 border-t border-gray-50 dark:border-gray-700">
                       <div className="flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                         <span>Estado Bomba</span>
                         <span className={activeZone.status.pump === 'ON' ? 'text-emerald-500 dark:text-emerald-400 font-bold' : ''}>{activeZone.status.pump}</span>
                       </div>
                       <button 
                         onClick={handleManualWater}
                         disabled={activeZone.status.pump !== 'OFF'}
                         className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                           ${activeZone.status.pump === 'ON' 
                             ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-default' 
                             : 'bg-gray-900 dark:bg-emerald-600 text-white hover:bg-gray-800 dark:hover:bg-emerald-700 shadow-lg shadow-gray-200 dark:shadow-none active:scale-95'
                           }`}
                       >
                         {activeZone.status.pump === 'ON' ? <><Activity size={16} className="animate-spin"/> Regando...</> : <><Zap size={16} /> Iniciar Riego Manual</>}
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           {/* Sensores Secundarios */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-4xl p-6 shadow-lg shadow-gray-100 dark:shadow-none border border-gray-50 dark:border-gray-700 flex flex-col justify-between h-48">
                 <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Temperatura</span>
                    <Thermometer className="text-orange-400" />
                 </div>
                 <div>
                    <span className="text-4xl font-bold text-gray-800 dark:text-white">{activeZone.sensors.temperature}°</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">celsius</span>
                 </div>
                 <div className="w-full bg-orange-50 dark:bg-orange-900/30 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-orange-400 h-full rounded-full" style={{ width: `${(activeZone.sensors.temperature / 40) * 100}%` }}></div>
                 </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-4xl p-6 shadow-lg shadow-gray-100 dark:shadow-none border border-gray-50 dark:border-gray-700 flex flex-col justify-between h-48">
                 <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Iluminación</span>
                    <Sun className="text-yellow-400" />
                 </div>
                 <div>
                    <span className="text-4xl font-bold text-gray-800 dark:text-white">{activeZone.sensors.lightLevel}%</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">{activeZone.sensors.lightLevel > 50 ? 'Día' : 'Noche'}</span>
                 </div>
                 <div className="w-full bg-yellow-50 dark:bg-yellow-900/30 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-yellow-400 h-full rounded-full" style={{ width: `${activeZone.sensors.lightLevel}%` }}></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Derecha (4 cols) */}
        <div className="lg:col-span-4 space-y-8 flex flex-col">
           {activeZone.config.useWeatherApi && (
             <WeatherWidget weather={weather} loading={weatherLoading} error={weatherError} />
           )}
           <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
              <h3 className="font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider absolute top-8 left-8">Nivel de Agua</h3>
              <TankVisual level={activeZone.sensors.tankLevel} />
              <div className="mt-8 text-center">
                 <p className={`font-bold text-xl ${activeZone.sensors.tankLevel < 20 ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                   {activeZone.sensors.tankLevel < 20 ? 'Nivel Bajo' : 'Óptimo'}
                 </p>
                 <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Capacidad del Tanque</p>
              </div>
           </div>
        </div>

      </div>

      {/* Modal para agregar zona */}
      <AddZoneModal 
        isOpen={showAddZoneModal}
        onClose={() => setShowAddZoneModal(false)}
        onAdd={handleAddZone}
      />
    </div>
  );
};

export default Dashboard;
