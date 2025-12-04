import React, { useState, useEffect } from 'react';
import { 
  Activity, ChevronUp, Droplets, Clock, 
  ChevronDown, Zap, Check, Home, Leaf, Settings, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';
import AnimatedBackground from '../components/AnimatedBackground';
import type { Zone, Event } from '../types';

interface StatisticsData {
  summary: {
    totalIrrigations: number;
    autoIrrigations: number;
    manualIrrigations: number;
    configChanges: number;
    tankAlerts: number;
    totalWaterUsed: number;
    totalDurationMinutes: number;
    avgDailyIrrigations: number;
    avgWaterPerDay: number;
  };
  dailyIrrigations: { date: string; day: string; count: number }[];
  recentEvents: Event[];
  period: { days: number; from: string; to: string };
}

// Simple line chart component
const MiniLineChart = ({ data, color = '#10B981', height = 60 }: { data: number[]; color?: string; height?: number }) => {
  if (!data.length) return <div className="h-16 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon 
        points={`0,100 ${points} 100,100`}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
      <polyline 
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Bar chart component
const BarChart = ({ data, labels, color = '#10B981' }: { data: number[]; labels: string[]; color?: string }) => {
  const max = Math.max(...data) || 1;
  
  return (
    <div className="flex items-end justify-between gap-2 h-32">
      {data.map((value, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{value}</span>
          <div 
            className="w-full rounded-t-lg transition-all duration-500"
            style={{ 
              height: `${(value / max) * 100}%`,
              backgroundColor: color,
              minHeight: value > 0 ? '8px' : '2px',
              opacity: value > 0 ? 1 : 0.3
            }}
          />
          <span className="text-[10px] text-gray-400 font-medium">{labels[index]}</span>
        </div>
      ))}
    </div>
  );
};

// Stat Card component
const StatCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  color, 
  trend,
  sparkline 
}: { 
  title: string; 
  value: number | string; 
  unit?: string; 
  icon: any; 
  color: string;
  trend?: { value: number; positive: boolean };
  sparkline?: number[];
}) => {
  const colorMap: Record<string, { bg: string; text: string; darkBg: string }> = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-900/30' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'dark:bg-blue-900/30' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'dark:bg-orange-900/30' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'dark:bg-purple-900/30' },
  };
  
  const colors = colorMap[color] || colorMap.emerald;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${colors.bg} ${colors.darkBg} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className={colors.text} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend.positive ? 'text-emerald-500' : 'text-red-500'}`}>
            <ChevronUp size={14} className={!trend.positive ? 'rotate-180' : ''} />
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {sparkline && sparkline.length > 0 && (
        <div className="mt-3 -mx-1">
          <MiniLineChart data={sparkline} color={colors.text.replace('text-', '#').replace('-600', '')} />
        </div>
      )}
    </div>
  );
};

const Statistics: React.FC = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Cargar zonas
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        const zonesRes = await fetch(`${API_CONFIG.BASE_URL}/zones/${user.id}`);
        if (!zonesRes.ok) throw new Error('Error al cargar zonas');
        const zonesData = await zonesRes.json();
        setZones(zonesData);
        if (zonesData.length > 0 && !selectedZone) {
          setSelectedZone(zonesData[0]);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Cargar estadísticas cuando cambia la zona o el rango de tiempo
  useEffect(() => {
    const loadStatistics = async () => {
      if (!user?.id) return;

      try {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const url = selectedZone 
          ? `${API_CONFIG.BASE_URL}/events/${user.id}/statistics?days=${days}&zoneId=${selectedZone.id}`
          : `${API_CONFIG.BASE_URL}/events/${user.id}/statistics?days=${days}`;
        
        const statsRes = await fetch(url);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStatistics(statsData);
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      }
    };

    loadStatistics();
  }, [user?.id, selectedZone?.id, timeRange]);

  // Datos para los gráficos
  const chartData = React.useMemo(() => {
    if (!statistics) {
      return {
        irrigationsByDay: Array(7).fill(0),
        dayNames: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      };
    }

    // Crear array de datos por día de la semana desde dailyIrrigations
    const dayNames = statistics.dailyIrrigations.map(d => d.day);
    const irrigationsByDay = statistics.dailyIrrigations.map(d => d.count);

    return {
      irrigationsByDay,
      dayNames,
    };
  }, [statistics]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
        <Activity className="animate-spin h-10 w-10 text-emerald-500" />
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
        <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
          <Activity size={64} className="mx-auto text-gray-200 dark:text-gray-600 mb-4" />
          <p className="text-gray-800 dark:text-white text-xl font-bold">No tienes zonas configuradas</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Crea una zona en el Dashboard para ver estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Estadísticas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Análisis y reportes de tu sistema de riego</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Zone Selector */}
          <div className="relative">
            <button
              onClick={() => setShowZoneDropdown(!showZoneDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                selectedZone?.type === 'Indoor' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
              }`}>
                {selectedZone?.type === 'Indoor' ? (
                  <Home size={14} className="text-blue-600 dark:text-blue-400" />
                ) : (
                  <Leaf size={14} className="text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <span>{selectedZone?.name || 'Seleccionar'}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showZoneDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showZoneDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                {zones.map(zone => (
                  <button
                    key={zone.id}
                    onClick={() => { setSelectedZone(zone); setShowZoneDropdown(false); }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedZone?.id === zone.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {zone.name}
                    {selectedZone?.id === zone.id && <Check size={16} className="ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time Range Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  timeRange === range 
                    ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Riegos"
          value={statistics?.summary.totalIrrigations || 0}
          icon={Droplets}
          color="emerald"
          sparkline={chartData.irrigationsByDay}
        />
        <StatCard
          title="Promedio Diario"
          value={statistics?.summary.avgDailyIrrigations || 0}
          unit="riegos/día"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Riegos Manuales"
          value={statistics?.summary.manualIrrigations || 0}
          icon={Zap}
          color="orange"
        />
        <StatCard
          title="Riegos Automáticos"
          value={statistics?.summary.autoIrrigations || 0}
          icon={Settings}
          color="purple"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Tiempo Total Riego"
          value={statistics?.summary.totalDurationMinutes || 0}
          unit="minutos"
          icon={Clock}
          color="emerald"
        />
        <StatCard
          title="Alertas de Tanque"
          value={statistics?.summary.tankAlerts || 0}
          icon={AlertTriangle}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Irrigations by Day */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Riegos por Día</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {timeRange === '7d' ? 'Últimos 7 días' : timeRange === '30d' ? 'Últimos 30 días' : 'Últimos 90 días'}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-emerald-600" />
            </div>
          </div>
          <BarChart data={chartData.irrigationsByDay} labels={chartData.dayNames} />
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Actividad Reciente</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Últimos eventos</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {statistics?.recentEvents.slice(0, 5).map((event, index) => {
              const getEventIcon = () => {
                if (event.type.includes('INICIO') || event.type === 'RIEGO_MANUAL') {
                  return <Droplets size={16} className="text-emerald-500" />;
                }
                if (event.type.includes('FIN')) {
                  return <Check size={16} className="text-blue-500" />;
                }
                if (event.type.includes('ALERTA')) {
                  return <AlertTriangle size={16} className="text-orange-500" />;
                }
                if (event.type.includes('CONFIG') || event.type.includes('SCHEDULES')) {
                  return <Settings size={16} className="text-purple-500" />;
                }
                return <Activity size={16} className="text-gray-400" />;
              };

              const getEventLabel = () => {
                switch (event.type) {
                  case 'RIEGO_MANUAL_INICIO': return 'Riego manual iniciado';
                  case 'RIEGO_MANUAL_FIN': return 'Riego manual finalizado';
                  case 'RIEGO_AUTO_INICIO': return 'Riego automático iniciado';
                  case 'RIEGO_AUTO_FIN': return 'Riego automático finalizado';
                  case 'ALERTA_TANQUE': return 'Alerta de tanque';
                  case 'CONFIG_CAMBIO': return 'Configuración actualizada';
                  case 'SCHEDULES_UPDATED': return 'Horarios actualizados';
                  case 'ZONA_CREADA': return 'Zona creada';
                  default: return event.description || event.type;
                }
              };

              return (
                <div key={event.id || index} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    {getEventIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{getEventLabel()}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleString('es-ES', { 
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {(!statistics?.recentEvents || statistics.recentEvents.length === 0) && (
              <div className="text-center py-8">
                <Activity size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Sin eventos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Water Usage Summary */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium mb-1">Consumo total de agua</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">{statistics?.summary.totalWaterUsed || 0}</span>
              <span className="text-emerald-100">litros</span>
            </div>
            <p className="text-emerald-100 text-sm mt-2">
              En {statistics?.summary.totalDurationMinutes || 0} minutos de riego • {statistics?.summary.totalIrrigations || 0} sesiones
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <Droplets size={48} className="text-white" />
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Statistics;
