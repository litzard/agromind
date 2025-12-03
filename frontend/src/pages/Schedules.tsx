import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Trash2, Sun, Moon, Check, X, 
  Sun as VacationIcon, Home, Leaf, ChevronDown, Save, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';
import type { Zone, WateringSchedule, VacationMode } from '../types';

const DAYS = [
  { id: 0, short: 'D', name: 'Domingo' },
  { id: 1, short: 'L', name: 'Lunes' },
  { id: 2, short: 'M', name: 'Martes' },
  { id: 3, short: 'X', name: 'Miércoles' },
  { id: 4, short: 'J', name: 'Jueves' },
  { id: 5, short: 'V', name: 'Viernes' },
  { id: 6, short: 'S', name: 'Sábado' },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_VACATION: VacationMode = {
  enabled: false,
  startDate: null,
  endDate: null,
  reducedWatering: true,
  reductionPercent: 50,
};

interface ScheduleItemProps {
  schedule: WateringSchedule;
  onUpdate: (schedule: WateringSchedule) => void;
  onDelete: (id: string) => void;
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({ schedule, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState(schedule.time);
  const [days, setDays] = useState(schedule.days);
  const [duration, setDuration] = useState(schedule.duration);

  const handleSave = () => {
    onUpdate({ ...schedule, time, days, duration });
    setEditing(false);
  };

  const toggleDay = (dayId: number) => {
    setDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId].sort()
    );
  };

  if (editing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 border-emerald-500 shadow-lg animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900 dark:text-white">Editar Horario</h4>
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors">
              <Check size={18} />
            </button>
            <button onClick={() => setEditing(false)} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Time Picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Hora</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Day Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Días</label>
          <div className="flex gap-2">
            {DAYS.map(day => (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  days.includes(day.id)
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Duración: {duration} segundos</label>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5s</span>
            <span>120s</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm transition-all ${
      !schedule.enabled ? 'opacity-60' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Time Display */}
          <div className="flex items-center gap-2">
            {parseInt(time.split(':')[0]) < 12 ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} className="text-indigo-500" />
            )}
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{time}</span>
          </div>

          {/* Days */}
          <div className="hidden sm:flex gap-1">
            {DAYS.map(day => (
              <span
                key={day.id}
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  days.includes(day.id)
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {day.short}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">{duration}s</span>
          
          {/* Toggle */}
          <button
            onClick={() => onUpdate({ ...schedule, enabled: !schedule.enabled })}
            className={`w-12 h-7 flex items-center rounded-full p-0.5 transition-colors ${
              schedule.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform ${
              schedule.enabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>

          <button onClick={() => setEditing(true)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Clock size={18} />
          </button>
          
          <button onClick={() => onDelete(schedule.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Days Display */}
      <div className="sm:hidden flex gap-1 mt-3">
        {DAYS.map(day => (
          <span
            key={day.id}
            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
              days.includes(day.id)
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
            }`}
          >
            {day.short}
          </span>
        ))}
      </div>
    </div>
  );
};

const Schedules: React.FC = () => {
  const { user, addNotification } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [schedules, setSchedules] = useState<WateringSchedule[]>([]);
  const [vacationMode, setVacationMode] = useState<VacationMode>(DEFAULT_VACATION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);

  // Cargar zonas
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
        console.error('Error cargando zonas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadZones();
  }, [user?.id]);

  // Cargar configuración cuando cambia la zona
  useEffect(() => {
    if (selectedZone) {
      setSchedules(selectedZone.config.schedules || []);
      setVacationMode(selectedZone.config.vacationMode || DEFAULT_VACATION);
    }
  }, [selectedZone]);

  const handleAddSchedule = () => {
    const newSchedule: WateringSchedule = {
      id: generateId(),
      time: '08:00',
      days: [1, 2, 3, 4, 5], // Lun-Vie por defecto
      enabled: true,
      duration: selectedZone?.config.wateringDuration || 10,
    };
    setSchedules(prev => [...prev, newSchedule]);
  };

  const handleUpdateSchedule = (updated: WateringSchedule) => {
    setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    if (!selectedZone || saving) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${selectedZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...selectedZone.config,
            schedules,
            vacationMode,
          }
        })
      });

      if (!response.ok) throw new Error('Error al guardar');

      // Actualizar zona local
      setZones(prev => prev.map(z => 
        z.id === selectedZone.id 
          ? { ...z, config: { ...z.config, schedules, vacationMode } }
          : z
      ));
      setSelectedZone(prev => prev ? { ...prev, config: { ...prev.config, schedules, vacationMode } } : null);

      addNotification('Guardado', 'Los horarios se guardaron correctamente.', 'info');
    } catch (error) {
      addNotification('Error', 'No se pudieron guardar los horarios.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
          <Clock size={64} className="mx-auto text-gray-200 dark:text-gray-600 mb-4" />
          <p className="text-gray-800 dark:text-white text-xl font-bold">No tienes zonas configuradas</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Crea una zona en el Dashboard para programar horarios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Horarios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Programa riegos automáticos</p>
        </div>

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
      </div>

      {/* Vacation Mode Card */}
      <div className={`rounded-2xl p-6 border-2 transition-all ${
        vacationMode.enabled 
          ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-transparent text-white' 
          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              vacationMode.enabled ? 'bg-white/20' : 'bg-orange-100 dark:bg-orange-900/30'
            }`}>
              <VacationIcon size={24} className={vacationMode.enabled ? 'text-white' : 'text-orange-500'} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${vacationMode.enabled ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                Modo Vacaciones
              </h3>
              <p className={`text-sm mt-1 ${vacationMode.enabled ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {vacationMode.enabled 
                  ? `Activo: riego reducido al ${vacationMode.reductionPercent}%`
                  : 'Reduce el riego automáticamente mientras no estás'
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => setVacationMode(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`w-14 h-8 flex items-center rounded-full p-0.5 transition-colors ${
              vacationMode.enabled ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <div className={`bg-white w-7 h-7 rounded-full shadow transform transition-transform ${
              vacationMode.enabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {vacationMode.enabled && (
          <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-orange-100 mb-2">Fecha inicio</label>
              <input
                type="date"
                value={vacationMode.startDate || ''}
                onChange={(e) => setVacationMode(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-orange-200 focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-100 mb-2">Fecha fin</label>
              <input
                type="date"
                value={vacationMode.endDate || ''}
                onChange={(e) => setVacationMode(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-orange-200 focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-orange-100 mb-2">
                Reducción de riego: {vacationMode.reductionPercent}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={vacationMode.reductionPercent}
                onChange={(e) => setVacationMode(prev => ({ ...prev, reductionPercent: Number(e.target.value) }))}
                className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-xs text-orange-200 mt-1">
                <span>Sin riego</span>
                <span>Normal</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedules List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">Horarios Programados</h3>
          <button
            onClick={handleAddSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-emerald-500/30"
          >
            <Plus size={18} /> Agregar
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-100 dark:border-gray-700 text-center">
            <Clock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No hay horarios programados</p>
            <button
              onClick={handleAddSchedule}
              className="mt-4 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
            >
              Crear primer horario
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(schedule => (
              <ScheduleItem
                key={schedule.id}
                schedule={schedule}
                onUpdate={handleUpdateSchedule}
                onDelete={handleDeleteSchedule}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/30"
      >
        {saving ? (
          <><Loader2 size={20} className="animate-spin" /> Guardando...</>
        ) : (
          <><Save size={20} /> Guardar Cambios</>
        )}
      </button>
    </div>
  );
};

export default Schedules;
