import { API_CONFIG } from '../config/api';

export interface WeatherData {
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain';
  rainProbability: number;
  description: string;
  cityName: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

export interface DailyForecast {
  date: Date;
  dayName: string;
  tempMin: number;
  tempMax: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain';
  rainProbability: number;
  description: string;
  icon: string;
}

export interface ExtendedForecast {
  current: WeatherData;
  daily: DailyForecast[];
}

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const getConditionFromMain = (main: string): 'Sunny' | 'Cloudy' | 'Rain' => {
  if (['Rain', 'Drizzle', 'Thunderstorm'].includes(main)) return 'Rain';
  if (main === 'Clouds') return 'Cloudy';
  return 'Sunny';
};

const getDayName = (date: Date): string => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[date.getDay()];
};

export const getLocalWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const apiKey = API_CONFIG.WEATHER_API_KEY;
    
    // 1. Obtener clima actual
    const currentRes = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=es`);
    if (!currentRes.ok) throw new Error('Error al obtener clima actual');
    const currentData = await currentRes.json();

    // 2. Obtener pronóstico (para probabilidad de lluvia)
    const forecastRes = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=es`);
    if (!forecastRes.ok) throw new Error('Error al obtener pronóstico');
    const forecastData = await forecastRes.json();

    // 3. Calcular probabilidad de lluvia
    const nextForecast = forecastData.list[0];
    const rainProbability = Math.round(nextForecast.pop * 100);

    return {
      temp: Math.round(currentData.main.temp),
      condition: getConditionFromMain(currentData.weather[0].main),
      rainProbability,
      description: currentData.weather[0].description,
      cityName: currentData.name,
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed * 3.6), // m/s to km/h
      feelsLike: Math.round(currentData.main.feels_like)
    };

  } catch (error) {
    console.error('Weather Service Error:', error);
    throw error;
  }
};

export const getExtendedForecast = async (lat: number, lon: number): Promise<ExtendedForecast> => {
  try {
    const apiKey = API_CONFIG.WEATHER_API_KEY;
    
    // Obtener clima actual
    const current = await getLocalWeather(lat, lon);
    
    // Obtener pronóstico de 5 días (cada 3 horas)
    const forecastRes = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=es`);
    if (!forecastRes.ok) throw new Error('Error al obtener pronóstico extendido');
    const forecastData = await forecastRes.json();

    // Agrupar por día y obtener temperaturas min/max
    const dailyMap = new Map<string, {
      temps: number[];
      conditions: string[];
      pops: number[];
      descriptions: string[];
      icons: string[];
      date: Date;
    }>();

    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          temps: [],
          conditions: [],
          pops: [],
          descriptions: [],
          icons: [],
          date
        });
      }
      
      const day = dailyMap.get(dateKey)!;
      day.temps.push(item.main.temp);
      day.conditions.push(item.weather[0].main);
      day.pops.push(item.pop || 0);
      day.descriptions.push(item.weather[0].description);
      day.icons.push(item.weather[0].icon);
    });

    // Convertir a array de DailyForecast (máximo 7 días)
    const daily: DailyForecast[] = Array.from(dailyMap.entries())
      .slice(0, 7)
      .map(([_, data]) => {
        // Determinar condición dominante del día
        const conditionCounts: Record<string, number> = {};
        data.conditions.forEach(c => {
          conditionCounts[c] = (conditionCounts[c] || 0) + 1;
        });
        const dominantCondition = Object.entries(conditionCounts)
          .sort((a, b) => b[1] - a[1])[0][0];

        return {
          date: data.date,
          dayName: getDayName(data.date),
          tempMin: Math.round(Math.min(...data.temps)),
          tempMax: Math.round(Math.max(...data.temps)),
          condition: getConditionFromMain(dominantCondition),
          rainProbability: Math.round(Math.max(...data.pops) * 100),
          description: data.descriptions[Math.floor(data.descriptions.length / 2)],
          icon: data.icons[Math.floor(data.icons.length / 2)]
        };
      });

    return { current, daily };

  } catch (error) {
    console.error('Extended Forecast Error:', error);
    throw error;
  }
};

export const getUserLocation = (): Promise<{lat: number, lon: number}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada por el navegador'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    }
  });
};
