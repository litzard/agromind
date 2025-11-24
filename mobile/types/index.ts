export interface User {
    id: number;
    name: string;
    email: string;
}

export interface ZoneConfig {
    autoMode: boolean;
    moistureThreshold: number;
    checkInterval: number;
    pumpDuration: number;
    useWeatherApi: boolean;
    respectRainForecast: boolean;
}

export interface ZoneSensors {
    soilMoisture: number;
    temperature: number;
    humidity: number;
    lightLevel: number;
    tankLevel: number;
}

export interface ZoneStatus {
    pump: 'ON' | 'OFF';
    lastWatered: string | null;
    nextScheduledWatering: string | null;
}

export interface Zone {
    id: number;
    name: string;
    type: 'Outdoor' | 'Indoor' | 'Greenhouse' | 'Orchard';
    config: ZoneConfig;
    sensors: ZoneSensors;
    status: ZoneStatus;
}

export interface AuthResponse extends User {
    token?: string;
}

export interface WeatherData {
    temp: number;
    humidity: number;
    description: string;
    icon: string;
    rainProb: number;
}
