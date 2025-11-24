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

export const getUserLocation = async (): Promise<{ lat: number; lon: number }> => {
    // Solicitar permisos
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Permiso de ubicación denegado');
    }

    // Obtener ubicación actual
    const location = await Location.getCurrentPositionAsync({});
    return {
        lat: location.coords.latitude,
        lon: location.coords.longitude
    };
};

export const getLocalWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    try {
        // 1. Obtener clima actual
        const currentRes = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_CONFIG.WEATHER_API_KEY}&lang=es`
        );
        if (!currentRes.ok) throw new Error('Error al obtener clima actual');
        const currentData = await currentRes.json();

        // 2. Obtener pronóstico (para probabilidad de lluvia)
        const forecastRes = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_CONFIG.WEATHER_API_KEY}&lang=es`
        );
        if (!forecastRes.ok) throw new Error('Error al obtener pronóstico');
        const forecastData = await forecastRes.json();

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
    } catch (error) {
        console.error('Weather Service Error:', error);
        throw error;
    }
};
