import React from 'react';
import { Sun, Cloud, CloudRain, Droplets, Thermometer, ChevronRight, Activity } from 'lucide-react';
import type { DailyForecast } from '../types';
import type { WeatherData } from '../services/weatherService';

interface WeatherForecastProps {
  current: WeatherData | null;
  forecast: DailyForecast[];
  loading: boolean;
  onExpand?: () => void;
}

const getWeatherIcon = (condition: string, size: number = 24) => {
  switch (condition) {
    case 'Rain':
      return <CloudRain size={size} className="text-blue-400" />;
    case 'Cloudy':
      return <Cloud size={size} className="text-gray-400" />;
    default:
      return <Sun size={size} className="text-yellow-400" />;
  }
};

const WeatherForecast: React.FC<WeatherForecastProps> = ({ current, forecast, loading, onExpand }) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse flex items-center gap-2">
            <Cloud className="animate-bounce" size={24} />
            <span>Cargando pronóstico...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-center h-32">
          <Cloud size={32} className="opacity-50 mr-2" />
          <span className="opacity-70">No se pudo cargar el clima</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl overflow-hidden shadow-xl">
      {/* Current Weather */}
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">{current.cityName}</p>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-6xl font-extrabold text-white">{current.temp}</span>
              <span className="text-2xl text-white/80 mb-2">°C</span>
            </div>
            <p className="text-white/80 text-sm capitalize mt-1">{current.description}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            {getWeatherIcon(current.condition, 48)}
          </div>
        </div>

        {/* Current Details */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
          <div className="text-center">
            <Droplets size={18} className="mx-auto text-white/70 mb-1" />
            <p className="text-white font-bold">{current.humidity}%</p>
            <p className="text-white/60 text-xs">Humedad</p>
          </div>
          <div className="text-center">
            <Activity size={18} className="mx-auto text-white/70 mb-1" />
            <p className="text-white font-bold">{current.windSpeed} km/h</p>
            <p className="text-white/60 text-xs">Viento</p>
          </div>
          <div className="text-center">
            <Thermometer size={18} className="mx-auto text-white/70 mb-1" />
            <p className="text-white font-bold">{current.feelsLike}°</p>
            <p className="text-white/60 text-xs">Sensación</p>
          </div>
        </div>

        {/* Rain Probability */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-sm">Probabilidad de Lluvia</span>
            <span className="text-white font-bold">{current.rainProbability}%</span>
          </div>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${current.rainProbability}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7 Day Forecast */}
      {forecast.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm">
          <div className="px-6 py-3 flex items-center justify-between border-b border-white/10">
            <span className="text-white/80 text-sm font-semibold">Próximos 7 días</span>
            {onExpand && (
              <button onClick={onExpand} className="text-white/60 hover:text-white flex items-center gap-1 text-sm">
                Ver más <ChevronRight size={16} />
              </button>
            )}
          </div>
          <div className="p-4 flex gap-2 overflow-x-auto scrollbar-hide">
            {forecast.slice(0, 7).map((day, index) => (
              <div 
                key={index}
                className={`flex-shrink-0 w-16 py-3 px-2 rounded-xl text-center transition-all ${
                  index === 0 ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <p className="text-white/70 text-xs font-medium mb-2">
                  {index === 0 ? 'Hoy' : day.dayName}
                </p>
                <div className="flex justify-center mb-2">
                  {getWeatherIcon(day.condition, 20)}
                </div>
                <p className="text-white font-bold text-sm">{day.tempMax}°</p>
                <p className="text-white/50 text-xs">{day.tempMin}°</p>
                {day.rainProbability > 30 && (
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    <Droplets size={10} className="text-blue-300" />
                    <span className="text-blue-200 text-[10px]">{day.rainProbability}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherForecast;
