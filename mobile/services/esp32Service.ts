import { API_CONFIG } from '../constants/api';
import { ZoneConfig, ZoneSensors, ZoneStatus } from '../types';

const getZoneDetailUrl = (zoneId: number) => `${API_CONFIG.BASE_URL}/zones/detail/${zoneId}`;

export interface ESP32SensorData {
    temperature?: number | null;
    soilMoisture?: number | null;
    waterLevel?: number | null;
    lightLevel?: number | null;
    pumpStatus?: boolean;
}

export interface ZoneRealtimePayload {
    id: number;
    sensors?: ZoneSensors | null;
    status?: ZoneStatus | null;
    config?: ZoneConfig | null;
    [key: string]: any;
}

export interface ESP32ConnectionStatus {
    connected: boolean;
    lastUpdate: string;
    signalStrength?: number;
}

class ESP32Service {
    private pollingInterval: NodeJS.Timeout | null = null;
    private subscribers: Map<number, (data: ZoneRealtimePayload) => void> = new Map();

    /**
     * Inicia el polling de datos para una zona específica
     */
    startPolling(zoneId: number, callback: (data: ZoneRealtimePayload) => void, intervalMs: number = 5000) {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        this.subscribers.clear();
        this.subscribers.set(zoneId, callback);

        this.fetchZoneSnapshot(zoneId);

        this.pollingInterval = setInterval(() => {
            this.fetchZoneSnapshot(zoneId);
        }, intervalMs);

        console.log(`📡 Polling iniciado para zona ${zoneId} cada ${intervalMs}ms`);
    }

    /**
     * Detiene el polling de datos
     */
    stopPolling(zoneId: number) {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.subscribers.delete(zoneId);
        console.log(`🛑 Polling detenido para zona ${zoneId}`);
    }

    /**
     * Obtiene datos de sensores del servidor
     */
    private async fetchZoneSnapshot(zoneId: number) {
        try {
            const response = await fetch(getZoneDetailUrl(zoneId));
            
            if (!response.ok) {
                console.error(`❌ Error fetching zone ${zoneId}: ${response.status}`);
                return;
            }

            const data = await response.json();
            
            const callback = this.subscribers.get(zoneId);
            if (callback) {
                callback({ id: zoneId, ...data });
            }
        } catch (error) {
            console.error(`❌ Error fetching sensor data for zone ${zoneId}:`, error);
        }
    }

    /**
     * Obtiene el estado de conexión del ESP32
     */
    async getConnectionStatus(zoneId: number): Promise<ESP32ConnectionStatus> {
        try {
            const response = await fetch(getZoneDetailUrl(zoneId));
            
            if (!response.ok) {
                return {
                    connected: false,
                    lastUpdate: 'Nunca'
                };
            }

            const data = await response.json();
            
            const connectionState = (data.status?.connection || '').toUpperCase();
            return {
                connected: connectionState === 'ONLINE',
                lastUpdate: data.status?.lastUpdate || 'Nunca'
            };
        } catch (error) {
            console.error('Error checking connection status:', error);
            return {
                connected: false,
                lastUpdate: 'Error'
            };
        }
    }

    /**
     * Controla el estado de la bomba
     */
    async togglePump(zoneId: number, state: boolean): Promise<boolean> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${zoneId}/pump`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: state ? 'ON' : 'OFF' })
            });

            if (!response.ok) {
                throw new Error(`Error toggling pump: ${response.status}`);
            }

            console.log(`💧 Bomba ${state ? 'encendida' : 'apagada'} para zona ${zoneId}`);
            return true;
        } catch (error) {
            console.error('Error toggling pump:', error);
            return false;
        }
    }

    /**
     * Obtiene el historial de lecturas
     */
    async getSensorHistory(zoneId: number, hours: number = 24): Promise<ESP32SensorData[]> {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/zones/${zoneId}/history?hours=${hours}`
            );

            if (!response.ok) {
                throw new Error(`Error fetching history: ${response.status}`);
            }

            const data = await response.json();
            return data.history || [];
        } catch (error) {
            console.error('Error fetching sensor history:', error);
            return [];
        }
    }

    /**
     * Verifica si el servidor está disponible
     */
    async pingServer(): Promise<boolean> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
                method: 'GET',
                timeout: 3000
            } as any);

            return response.ok;
        } catch (error) {
            console.error('Server ping failed:', error);
            return false;
        }
    }

    /**
     * Obtiene estadísticas del ESP32
     */
    async getESP32Stats(zoneId: number) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${zoneId}/stats`);
            
            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching ESP32 stats:', error);
            return null;
        }
    }
}

export default new ESP32Service();
