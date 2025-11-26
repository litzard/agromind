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

    /**
     * Escanea la red local buscando dispositivos ESP32 AgroMind
     * Prueba IPs comunes en la subred local
     */
    async scanForESP32Devices(baseIP?: string): Promise<ESP32DeviceInfo[]> {
        const devices: ESP32DeviceInfo[] = [];
        const timeout = 2000; // 2 segundos timeout por IP
        
        // Si no se proporciona IP base, usar rangos comunes
        const subnets = baseIP 
            ? [baseIP.split('.').slice(0, 3).join('.')] 
            : ['192.168.1', '192.168.0', '10.0.0', '10.227.93']; // Agregada la red del usuario
        
        console.log('🔍 Escaneando red local buscando ESP32...');
        
        for (const subnet of subnets) {
            // Escanear IPs del 1 al 254 en paralelo (en bloques para no saturar)
            const scanPromises: Promise<ESP32DeviceInfo | null>[] = [];
            
            for (let i = 1; i <= 254; i++) {
                const ip = `${subnet}.${i}`;
                scanPromises.push(this.probeESP32(ip, timeout));
            }
            
            // Procesar en bloques de 50 para no saturar
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
            
            // Si encontramos dispositivos en esta subred, no buscar en otras
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
        } catch (error) {
            // Silenciosamente ignorar errores (la mayoría de IPs no tendrán ESP32)
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
     * Desempareja un ESP32 (borra su configuración)
     */
    async unpairESP32(ip: string): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`🔓 Desemparejando ESP32 en ${ip}...`);
            
            const response = await fetch(`http://${ip}/unpair`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ ESP32 desemparejado: ${data.message}`);
            return { success: data.success, message: data.message };
        } catch (error) {
            console.error('❌ Error desemparejando ESP32:', error);
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
