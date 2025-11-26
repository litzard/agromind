import { API_CONFIG } from '../constants/api';

const getZoneDetailUrl = (zoneId: number) => `${API_CONFIG.BASE_URL}/zones/detail/${zoneId}`;

export interface ESP32SensorData {
    temperature: number;
    soilMoisture: number;
    waterLevel: number;
    lightLevel: number;
    pumpStatus: boolean;
}

export interface ESP32ConnectionStatus {
    connected: boolean;
    lastUpdate: string;
    signalStrength?: number;
}

class ESP32Service {
    private pollingInterval: NodeJS.Timeout | null = null;
    private subscribers: Map<number, (data: ESP32SensorData) => void> = new Map();

    /**
     * Inicia el polling de datos para una zona específica
     */
    startPolling(zoneId: number, callback: (data: ESP32SensorData) => void, intervalMs: number = 5000) {
        // Guardar callback
        this.subscribers.set(zoneId, callback);

        // Hacer primera lectura inmediata
        this.fetchSensorData(zoneId);

        // Iniciar polling
        this.pollingInterval = setInterval(() => {
            this.fetchSensorData(zoneId);
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
    private async fetchSensorData(zoneId: number) {
        try {
            const response = await fetch(getZoneDetailUrl(zoneId));
            
            if (!response.ok) {
                console.error(`❌ Error fetching zone ${zoneId}: ${response.status}`);
                return;
            }

            const data = await response.json();
            
            if (data.sensors) {
                const callback = this.subscribers.get(zoneId);
                if (callback) {
                    callback(data.sensors);
                }
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
                body: JSON.stringify({ state })
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
