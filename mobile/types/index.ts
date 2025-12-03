export interface User {
    id: number;
    name: string;
    email: string;
}

type SensorValue = number | null | undefined;

// Interfaces para horarios programados
export interface WateringSchedule {
    id: string;
    time: string; // "HH:MM"
    days: string[]; // ["lun", "mar", "mié", ...]
    enabled: boolean;
    duration: number; // segundos
}

// Modo vacaciones
export interface VacationMode {
    enabled: boolean;
    startDate: string | null;
    endDate: string | null;
    reducedWatering: boolean;
    reductionPercent: number;
}

export interface ZoneConfig {
    autoMode: boolean;
    moistureThreshold: number;
    wateringDuration: number;
    useWeatherApi: boolean;
    respectRainForecast: boolean;
    weatherAdjust?: boolean;
    schedules?: WateringSchedule[];
    vacationMode?: VacationMode;
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
    windSpeed?: number;
    feelsLike?: number;
}

// Pronóstico extendido
export interface DailyForecast {
    date: string;
    day: string;
    tempMin: number;
    tempMax: number;
    icon: string;
    description: string;
    rainProb: number;
}

export interface ExtendedForecast {
    current: WeatherData;
    daily: DailyForecast[];
}

// Estadísticas de zona
export interface ZoneStatistics {
    totalIrrigations: number;
    autoIrrigations: number;
    manualIrrigations: number;
    configChanges: number;
    totalWaterUsed: number;
    waterSaved: number;
    avgDailyIrrigations: number;
    avgWaterPerDay: number;
}

export interface DailyIrrigation {
    date: string;
    day: string;
    count: number;
}

export interface StatisticsResponse {
    summary: ZoneStatistics;
    dailyIrrigations: DailyIrrigation[];
    recentEvents: Event[];
    period: {
        days: number;
        from: string;
        to: string;
    };
}

// Eventos
export interface Event {
    id: number;
    type: string;
    description: string;
    timestamp: string;
    zoneId: number;
    metadata?: Record<string, any>;
}
