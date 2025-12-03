import { API_CONFIG } from '../config/api';
import type { ZoneConfig, ZoneSensors, ZoneStatus, ESP32DeviceInfo, ESP32ConnectionStatus } from '../types';

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

class ESP32Service {
    private pollingInterval: number | null = null;
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

        this.pollingInterval = window.setInterval(() => {
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
     * Verifica conexión del ESP32 para una zona
     */
    async verifyESP32Connection(zoneId: number): Promise<{ connected: boolean; message: string }> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/iot/verify-connection/${zoneId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                return { connected: false, message: 'Error al verificar conexión' };
            }

            const data = await response.json();
            return {
                connected: data.connected || false,
                message: data.message || 'Verificación completada'
            };
        } catch (error) {
            console.error('Error verifying ESP32 connection:', error);
            return { connected: false, message: 'Error de conexión con el servidor' };
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
            const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/health`, {
                method: 'GET',
            });

            return response.ok;
        } catch (error) {
            console.error('Server ping failed:', error);
            return false;
        }
    }

    /**
     * Escanea la red local buscando dispositivos ESP32 AgroMind
     */
    async scanForESP32Devices(baseIP?: string): Promise<ESP32DeviceInfo[]> {
        const devices: ESP32DeviceInfo[] = [];
        const timeout = 2000;
        
        const subnets = baseIP 
            ? [baseIP.split('.').slice(0, 3).join('.')] 
            : ['192.168.1', '192.168.0', '10.0.0'];
        
        console.log('🔍 Escaneando red local buscando ESP32...');
        
        for (const subnet of subnets) {
            const scanPromises: Promise<ESP32DeviceInfo | null>[] = [];
            
            for (let i = 1; i <= 254; i++) {
                const ip = `${subnet}.${i}`;
                scanPromises.push(this.probeESP32(ip, timeout));
            }
            
            const chunkSize = 50;
            for (let i = 0; i < scanPromises.length; i += chunkSize) {
                const chunk = scanPromises.slice(i, i + chunkSize);
                const results = await Promise.all(chunk);
                
                for (const result of results) {
                    if (result) {
                        devices.push(result);
                        console.log(`✅ ESP32 encontrado: ${result.ip} (${result.mac})`);
                    }
                }
            }
            
            if (devices.length > 0) break;
        }
        
        console.log(`📡 Escaneo completado. ${devices.length} dispositivo(s) encontrado(s)`);
        return devices;
    }

    /**
     * Prueba si una IP específica tiene un ESP32 AgroMind
     */
    async probeESP32(ip: string, timeout: number = 2000): Promise<ESP32DeviceInfo | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(`http://${ip}/info`, {
                method: 'GET',
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data.device === 'AgroMind-ESP32') {
                    return {
                        ip,
                        device: data.device,
                        mac: data.mac,
                        zoneId: data.zoneId || 0,
                        configured: data.configured || false,
                        pumpState: data.pumpState || false,
                        sensors: data.sensors || { temperature: 0, humidity: 0, soilMoisture: 0, tankLevel: 0 }
                    };
                }
            }
        } catch {
            // Silenciosamente ignorar errores
        }
        return null;
    }

    /**
     * Empareja un ESP32 con una zona específica
     */
    async pairESP32(ip: string, zoneId: number): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`🔗 Emparejando ESP32 en ${ip} con zona ${zoneId}...`);
            
            const response = await fetch(`http://${ip}/pair`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ zoneId }),
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ ESP32 emparejado: ${data.message}`);
            return { success: data.success, message: data.message };
        } catch (error) {
            console.error('❌ Error emparejando ESP32:', error);
            return { 
                success: false, 
                message: error instanceof Error ? error.message : 'Error de conexión' 
            };
        }
    }

    /**
     * Prueba conexión directa a un ESP32 por IP
     */
    async testESP32Connection(ip: string): Promise<ESP32DeviceInfo | null> {
        return this.probeESP32(ip, 5000);
    }
}

export default new ESP32Service();
