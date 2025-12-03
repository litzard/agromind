// Configuración de API - Usar producción en Render
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'https://agromind-5hb1.onrender.com/api',
    WEATHER_API_KEY: 'bd5e378503939ddaee76f12ad7a97608'
};
