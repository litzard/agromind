// Tipos compartidos - Consistentes con mobile

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface WateringSchedule {
    id: string;
    time: string; // HH:mm format
    days: number[]; // 0-6, Sunday-Saturday
    enabled: boolean;
    duration: number; // seconds
}

export interface VacationMode {
    enabled: boolean;
    startDate: string | null;
    endDate: string | null;
    reducedWatering: boolean; // Reduce frequency instead of stopping
    reductionPercent: number; // 0-100
}

export interface ZoneConfig {
    autoMode: boolean;
    moistureThreshold: number;
    wateringDuration: number;
    useWeatherApi: boolean;
    respectRainForecast: boolean;
    schedules?: WateringSchedule[];
    vacationMode?: VacationMode;
}

export interface ZoneSensors {
    soilMoisture: number | null;
    temperature: number | null;
    humidity: number | null;
    lightLevel: number | null;
    tankLevel: number | null;
    waterLevel: number | null;
}

export interface ZoneStatus {
    pump: 'ON' | 'OFF' | 'LOCKED';
    lastWatered: string | null;
    connection: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
    nextScheduledWatering: string | null;
    lastUpdate: string | null;
    hasSensorData: boolean;
}

export interface Zone {
    id: number;
    userId: number;
    name: string;
    type: 'Indoor' | 'Outdoor' | 'Greenhouse';
    sensors: ZoneSensors;
    status: ZoneStatus;
    config: ZoneConfig;
    createdAt?: string;
    updatedAt?: string;
}

export interface SensorReading {
    timestamp: string;
    soilMoisture: number | null;
    temperature: number | null;
    humidity: number | null;
    lightLevel: number | null;
    tankLevel: number | null;
}

export interface ZoneStatistics {
    totalWaterings: number;
    totalWaterUsed: number; // liters approximation
    avgMoisture: number;
    avgTemperature: number;
    irrigationsByDay: { date: string; count: number }[];
    moistureHistory: SensorReading[];
}

export interface WeatherData {
    temp: number;
    condition: 'Sunny' | 'Cloudy' | 'Rain';
    rainProbability: number;
    description: string;
    cityName: string;
    humidity?: number;
    windSpeed?: number;
    feelsLike?: number;
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

export interface Event {
    id: number;
    type: 'irrigation_start' | 'irrigation_end' | 'pump_locked' | 'pump_unlocked' | 'zone_created' | 'zone_deleted' | 'sensor_alert' | 'connection_lost' | 'connection_restored' | 'schedule_triggered' | 'vacation_mode_enabled' | 'vacation_mode_disabled';
    description: string;
    timestamp: string;
    zoneId: number;
    metadata?: Record<string, any>;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    timestamp: Date;
    read?: boolean;
}

export interface ESP32DeviceInfo {
    ip: string;
    device: string;
    mac: string;
    zoneId: number;
    configured: boolean;
    pumpState: boolean;
    sensors: {
        temperature: number;
        humidity: number;
        soilMoisture: number;
        tankLevel: number;
    };
}

export interface ESP32ConnectionStatus {
    connected: boolean;
    lastUpdate: string;
    signalStrength?: number;
}
