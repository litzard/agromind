export interface User {
    id: number;
    name: string;
    email: string;
}

type SensorValue = number | null | undefined;

export interface ZoneConfig {
    autoMode: boolean;
    moistureThreshold: number;
    wateringDuration: number;
    useWeatherApi: boolean;
    respectRainForecast: boolean;
}

export interface ZoneSensors {
    soilMoisture: SensorValue;
    temperature: SensorValue;
    humidity: SensorValue;
    lightLevel: SensorValue;
    tankLevel: SensorValue;
    waterLevel?: SensorValue;
}

export interface ZoneStatus {
    pump: 'ON' | 'OFF' | 'LOCKED';
    lastWatered: string | null;
    nextScheduledWatering?: string | null;
    connection: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
    lastUpdate?: string | null;
    hasSensorData?: boolean;
}

export interface Zone {
    id: number;
    name: string;
    type: 'Outdoor' | 'Indoor' | 'Greenhouse' | 'Orchard';
    config: ZoneConfig;
    sensors: ZoneSensors | null;
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
