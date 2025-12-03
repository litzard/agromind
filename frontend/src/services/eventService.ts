import { API_CONFIG } from '../config/api';
import type { Event } from '../types';

class EventService {
    /**
     * Obtiene los eventos del usuario
     */
    async getEvents(userId: number, options?: { limit?: number; zoneId?: number; type?: string }): Promise<Event[]> {
        try {
            const params = new URLSearchParams();
            if (options?.limit) params.append('limit', options.limit.toString());
            if (options?.zoneId) params.append('zoneId', options.zoneId.toString());
            if (options?.type) params.append('type', options.type);

            const url = `${API_CONFIG.BASE_URL}/events/${userId}${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Error al obtener eventos');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    }

    /**
     * Crea un nuevo evento
     */
    async createEvent(event: {
        userId: number;
        zoneId: number;
        type: string;
        description: string;
        metadata?: Record<string, any>;
    }): Promise<Event | null> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });

            if (!response.ok) {
                throw new Error('Error al crear evento');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating event:', error);
            return null;
        }
    }

    /**
     * Limpia eventos antiguos
     */
    async clearOldEvents(userId: number, olderThanDays?: number): Promise<number> {
        try {
            const url = olderThanDays 
                ? `${API_CONFIG.BASE_URL}/events/${userId}?olderThan=${olderThanDays}`
                : `${API_CONFIG.BASE_URL}/events/${userId}`;
            
            const response = await fetch(url, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Error al eliminar eventos');
            }

            const data = await response.json();
            return data.deleted || 0;
        } catch (error) {
            console.error('Error clearing events:', error);
            return 0;
        }
    }

    /**
     * Formatea el tipo de evento para mostrar
     */
    getEventTypeLabel(type: string): { label: string; color: string; icon: string } {
        const types: Record<string, { label: string; color: string; icon: string }> = {
            'irrigation_start': { label: 'Riego Iniciado', color: 'emerald', icon: 'play' },
            'irrigation_end': { label: 'Riego Finalizado', color: 'blue', icon: 'stop' },
            'pump_locked': { label: 'Bomba Bloqueada', color: 'red', icon: 'lock' },
            'pump_unlocked': { label: 'Bomba Desbloqueada', color: 'green', icon: 'unlock' },
            'zone_created': { label: 'Zona Creada', color: 'purple', icon: 'plus' },
            'zone_deleted': { label: 'Zona Eliminada', color: 'gray', icon: 'trash' },
            'sensor_alert': { label: 'Alerta de Sensor', color: 'orange', icon: 'alert' },
            'connection_lost': { label: 'Conexión Perdida', color: 'red', icon: 'wifi-off' },
            'connection_restored': { label: 'Conexión Restaurada', color: 'green', icon: 'wifi' },
        };

        return types[type] || { label: type, color: 'gray', icon: 'info' };
    }
}

export default new EventService();
