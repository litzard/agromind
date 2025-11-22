export interface WeatherData {
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain';
  rainProbability: number;
  description: string;
  cityName: string;
}

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const getLocalWeather = async (lat: number, lon: number, apiKey: string): Promise<WeatherData> => {
  try {
    // 1. Obtener clima actual
    const currentRes = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=es`);
    if (!currentRes.ok) throw new Error('Error al obtener clima actual');
    const currentData = await currentRes.json();

    // 2. Obtener pronóstico (para probabilidad de lluvia)
    const forecastRes = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=es`);
    if (!forecastRes.ok) throw new Error('Error al obtener pronóstico');
    const forecastData = await forecastRes.json();

    // 3. Calcular probabilidad de lluvia (pop = probability of precipitation)
    // Tomamos el valor más alto de las próximas 3 horas (primer elemento de la lista)
    const nextForecast = forecastData.list[0];
    const rainProbability = Math.round(nextForecast.pop * 100);

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
        }
      );
    }
  });
};
