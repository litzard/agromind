import React, { useState, useEffect } from 'react';
import { Droplets, Clock, Filter, AlertTriangle, Wifi, WifiOff, Plus, Trash2, Loader2, Settings, X, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';
import eventService from '../services/eventService';
import type { Event, Zone } from '../types';

const History: React.FC = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const zonesResponse = await fetch(`${API_CONFIG.BASE_URL}/zones/${user.id}`);
        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json();
          setZones(zonesData);
        }

        const eventsData = await eventService.getEvents(user.id, { limit: 100 });
        setEvents(eventsData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Refresh function for future use
  const _refreshEvents = async () => {
    if (!user?.id || refreshing) return;
    setRefreshing(true);
    try {
      const eventsData = await eventService.getEvents(user.id, { limit: 100 });
      setEvents(eventsData);
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  };
  void _refreshEvents; // Suppress unused warning

  const getZoneName = (zoneId: number): string => {
    const zone = zones.find(z => z.id === zoneId);
    return zone?.name || `Zona ${zoneId}`;
  };

  const filteredEvents = selectedZoneFilter === 'all'
    ? events
    : events.filter(event => event.zoneId.toString() === selectedZoneFilter);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const getEventConfig = (type: string) => {
    const configs: Record<string, { icon: any; color: string; bg: string; label: string }> = {
      'irrigation_start': { icon: Droplets, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Riego Iniciado' },
      'irrigation_end': { icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Riego Finalizado' },
      'pump_locked': { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: 'Bomba Bloqueada' },
      'pump_unlocked': { icon: Check, color: 'text-green-500', bg: 'bg-green-50', label: 'Bomba Desbloqueada' },
      'zone_created': { icon: Plus, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Zona Creada' },
      'zone_deleted': { icon: Trash2, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Zona Eliminada' },
      'sensor_alert': { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Alerta Sensor' },
      'connection_lost': { icon: WifiOff, color: 'text-red-500', bg: 'bg-red-50', label: 'Conexión Perdida' },
      'connection_restored': { icon: Wifi, color: 'text-green-500', bg: 'bg-green-50', label: 'Conexión Restaurada' },
    };

    return configs[type] || { icon: Settings, color: 'text-gray-500', bg: 'bg-gray-100', label: type };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500">Cargando historial...</p>
        </div>
      </div>
    );
  }

  const selectedZoneName = selectedZoneFilter === 'all'
    ? `Todas las zonas (${zones.length})`
    : getZoneName(parseInt(selectedZoneFilter));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Historial de Eventos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registro de actividad del sistema de riego</p>
      </div>

      {/* Filter Button - Mobile Style */}
      <button
        onClick={() => setShowFilterModal(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <Filter size={20} className="text-gray-400" />
        <span className="flex-1 text-left font-bold text-gray-900 dark:text-white">{selectedZoneName}</span>
        <ChevronDown size={20} className="text-gray-400" />
      </button>

      {/* Events List - Mobile Style */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-16 rounded-3xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
            <Clock size={64} className="mx-auto text-gray-200 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No hay eventos registrados</p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const config = getEventConfig(event.type);
            const Icon = config.icon;
            const isAutomatic = event.metadata?.mode === 'auto';

            return (
              <div key={event.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex gap-4">
                  {/* Icon - Circular 48x48 like mobile */}
                  <div className={`w-12 h-12 ${config.bg} dark:bg-opacity-20 rounded-full flex items-center justify-center shrink-0`}>
                    <Icon size={24} className={config.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">{getZoneName(event.zoneId)}</h3>
                      {event.type.includes('irrigation') && (
                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isAutomatic 
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          {isAutomatic ? 'Automático' : 'Manual'}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">{event.description}</p>
                    
                    <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span className="text-xs">{formatTimestamp(event.timestamp)}</span>
                      </div>
                      {event.metadata?.duration && (
                        <div className="flex items-center gap-1">
                          <Droplets size={14} className="text-gray-400" />
                          <span className="text-xs">{event.metadata.duration} min de riego</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Filter Modal - Mobile Style */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowFilterModal(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg max-h-[70vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Filtrar por zona</h3>
              <button 
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Options */}
            <div className="pb-8">
              <button
                onClick={() => {
                  setSelectedZoneFilter('all');
                  setShowFilterModal(false);
                }}
                className={`w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                  selectedZoneFilter === 'all' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className={`font-semibold ${selectedZoneFilter === 'all' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                  Todas las zonas ({zones.length})
                </span>
                {selectedZoneFilter === 'all' && (
                  <Check size={24} className="text-emerald-600" />
                )}
              </button>

              {zones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => {
                    setSelectedZoneFilter(zone.id.toString());
                    setShowFilterModal(false);
                  }}
                  className={`w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                    selectedZoneFilter === zone.id.toString() ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`font-semibold ${selectedZoneFilter === zone.id.toString() ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                    {zone.name}
                  </span>
                  {selectedZoneFilter === zone.id.toString() && (
                    <Check size={24} className="text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
