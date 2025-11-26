import { API_CONFIG } from '../constants/api';
import * as Location from 'expo-location';

export interface WeatherData {
    temp: number;
    condition: 'Sunny' | 'Cloudy' | 'Rain';
    rainProbability: number;
    description: string;
    cityName: string;
}

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const FALLBACK_WEATHER: WeatherData = {
    temp: 22,
    condition: 'Cloudy',
    rainProbability: 30,
    description: 'Condiciones estimadas',
    cityName: 'Ubicación estimada'
};

const isRateLimitError = (body: any, status: number) => {
    if (status === 429) {
        return true;
    }
    if (typeof body === 'object' && body?.message) {
        const message = String(body.message).toLowerCase();
        return message.includes('limit') || message.includes('blocked');
    }
    return false;
};

const fetchWeatherJson = async (url: string) => {
    const response = await fetch(url);
    const rawBody = await response.text();
    let parsedBody: any = null;
    try {
        parsedBody = rawBody ? JSON.parse(rawBody) : null;
    } catch (_err) {
        parsedBody = rawBody;
    }

    if (!response.ok) {
        const rateLimit = isRateLimitError(parsedBody, response.status);
        const error = new Error(rateLimit ? 'WEATHER_RATE_LIMIT' : `WEATHER_HTTP_${response.status}`);
        (error as any).details = parsedBody;
        throw error;
    }

    return parsedBody;
};

const getLastKnownCoords = async () => {
    const lastKnown = await Location.getLastKnownPositionAsync({});
    if (!lastKnown) {
        return null;
    }
    return {
        lat: lastKnown.coords.latitude,
        lon: lastKnown.coords.longitude
    };
};

export const getUserLocation = async (): Promise<{ lat: number; lon: number }> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        const cached = await getLastKnownCoords();
        if (cached) {
            return cached;
        }
        throw new Error('Permiso de ubicación denegado');
    }

    try {
        if (!(await Location.hasServicesEnabledAsync())) {
            throw new Error('Servicios de ubicación desactivados');
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            maximumAge: 15000,
            timeout: 10000
        });

        return {
            lat: location.coords.latitude,
            lon: location.coords.longitude
        };
    } catch (error) {
        const cached = await getLastKnownCoords();
        if (cached) {
            return cached;
        }
        throw error;
    }
};

export const getLocalWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    try {
        const currentData = await fetchWeatherJson(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_CONFIG.WEATHER_API_KEY}&lang=es`
        );

        const forecastData = await fetchWeatherJson(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_CONFIG.WEATHER_API_KEY}&lang=es`
        );

        // 3. Calcular probabilidad de lluvia
        const nextForecast = forecastData.list[0];
        const rainProbability = Math.round((nextForecast.pop || 0) * 100);

        // 4. Determinar condición general
        let condition: 'Sunny' | 'Cloudy' | 'Rain' = 'Sunny';
        const mainCondition = currentData.weather[0].main;
        
        if (['Rain', 'Drizzle', 'Thunderstorm'].includes(mainCondition)) {
            condition = 'Rain';
        } else if (mainCondition === 'Clouds') {
            condition = 'Cloudy';
        }

        return {
            temp: Math.round(currentData.main.temp),
            condition,
            rainProbability,
            description: currentData.weather[0].description,
            cityName: currentData.name
        };
    } catch (error: any) {
        const code = error?.message || '';
        if (code === 'WEATHER_RATE_LIMIT') {
            console.warn('Weather API alcanzó el límite, usando datos estimados.');
            return FALLBACK_WEATHER;
        }

        console.error('Weather Service Error:', error?.details || error);
        throw new Error('Error al obtener clima actual');
    }
};
