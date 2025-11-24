import React, { useState, useEffect } from 'react';
import { Droplets, Clock, User, Cpu, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Zone {
  id: string;
  name: string;
  type: 'Outdoor' | 'Indoor' | 'Greenhouse';
}

interface IrrigationEvent {
  id: string;
  zoneId: string;
  zoneName: string;
  eventType: 'manual' | 'automatic' | 'scheduled';
  timestamp: string;
  duration: number;
  reason: string;
}

// Mock data de eventos de riego
const MOCK_EVENTS: IrrigationEvent[] = [
  {
    id: '1',
    zoneId: 'z1',
    zoneName: 'Jardín Principal',
    eventType: 'automatic',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    duration: 10,
    reason: 'Humedad bajo umbral (28%)'
  },
  {
    id: '2',
    zoneId: 'z2',
    zoneName: 'Invernadero',
    eventType: 'manual',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    duration: 15,
    reason: 'Activado manualmente por usuario'
  },
  {
    id: '3',
    zoneId: 'z1',
    zoneName: 'Jardín Principal',
    eventType: 'automatic',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    duration: 10,
    reason: 'Humedad bajo umbral (25%)'
  },
  {
    id: '4',
    zoneId: 'z2',
    zoneName: 'Invernadero',
    eventType: 'automatic',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    duration: 12,
    reason: 'Humedad bajo umbral (35%)'
  },
  {
    id: '5',
    zoneId: 'z1',
    zoneName: 'Jardín Principal',
    eventType: 'manual',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    duration: 8,
    reason: 'Activado manualmente por usuario'
  },
];

const History: React.FC = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [events] = useState<IrrigationEvent[]>(MOCK_EVENTS);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Cargar zonas del usuario
  useEffect(() => {
    const loadZones = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/zones/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setZones(data);
        }
      } catch (error) {
        console.error('Error al cargar zonas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadZones();
  }, [user?.id]);

  // Filtrar eventos por zona
  const filteredEvents = selectedZoneFilter === 'all'
    ? events
    : events.filter(event => event.zoneId === selectedZoneFilter);

  // Formatear timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `Hace ${diffMins} minutos`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} horas`;
    } else if (diffDays === 1) {
      return 'Ayer';
    } else {
      return `Hace ${diffDays} días`;
    }
  };

  // Obtener ícono y color según tipo de evento
  const getEventConfig = (eventType: string) => {
    switch (eventType) {
      case 'manual':
        return { icon: User, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', label: 'Manual' };
      case 'automatic':
        return { icon: Cpu, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', label: 'Automático' };
      default:
        return { icon: Clock, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/30', label: 'Programado' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 dark:text-gray-400">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historial de Eventos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Registro de actividad del sistema de riego</p>
        </div>

        {/* Filtro por zona */}
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={selectedZoneFilter}
            onChange={(e) => setSelectedZoneFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todas las zonas ({events.length})</option>
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>
                {zone.name} ({events.filter(e => e.zoneId === zone.id).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de eventos */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Droplets size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              No hay eventos registrados
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Los eventos de riego aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredEvents.map((event, index) => {
              const config = getEventConfig(event.eventType);
              const Icon = config.icon;

              return (
                <div key={event.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`${config.bg} p-3 rounded-full`}>
                        <Icon size={20} className={config.color} />
                      </div>
                      {index < filteredEvents.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" style={{ minHeight: '30px' }}></div>
                      )}
                    </div>

                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {event.zoneName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {event.reason}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span>{formatTimestamp(event.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Droplets size={14} />
                          <span>{event.duration} min de riego</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats footer */}
      {filteredEvents.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Total Eventos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{filteredEvents.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Riegos Automáticos</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {filteredEvents.filter(e => e.eventType === 'automatic').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Riegos Manuales</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {filteredEvents.filter(e => e.eventType === 'manual').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
