import { API_CONFIG } from '../config/api';
import type { User, Zone, ZoneConfig } from '../types';

const API_URL = API_CONFIG.BASE_URL;

interface LoginResponse {
  id: number;
  email: string;
  name: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Si la cuenta no está verificada, incluir esa info en el error
      if (error.needsVerification) {
        const err: any = new Error(error.error || 'Cuenta no verificada');
        err.needsVerification = true;
        err.email = error.email;
        throw err;
      }
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    return response.json();
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar usuario');
    }

    return response.json();
  },

  async updateProfile(userId: number, data: { name?: string; email?: string }): Promise<User> {
    const response = await fetch(`${API_URL}/auth/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar perfil');
    }

    return response.json();
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/change-password/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar contraseña');
    }
  },
};

export const zonesApi = {
  async getZones(userId: number): Promise<Zone[]> {
    const response = await fetch(`${API_URL}/zones/${userId}`);
    if (!response.ok) throw new Error('Error al obtener zonas');
    return response.json();
  },

  async getZoneDetail(zoneId: number): Promise<Zone> {
    const response = await fetch(`${API_URL}/zones/detail/${zoneId}`);
    if (!response.ok) throw new Error('Error al obtener zona');
    return response.json();
  },

  async createZone(zoneData: Partial<Zone>): Promise<Zone> {
    const response = await fetch(`${API_URL}/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zoneData),
    });
    if (!response.ok) throw new Error('Error al crear zona');
    return response.json();
  },

  async updateZone(id: number, zoneData: Partial<Zone>): Promise<Zone> {
    const response = await fetch(`${API_URL}/zones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zoneData),
    });
    if (!response.ok) throw new Error('Error al actualizar zona');
    return response.json();
  },

  async updateZoneConfig(id: number, config: Partial<ZoneConfig>): Promise<Zone> {
    const response = await fetch(`${API_URL}/zones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    if (!response.ok) throw new Error('Error al actualizar configuración');
    return response.json();
  },

  async deleteZone(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/zones/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar zona');
  },

  async togglePump(zoneId: number, action: 'ON' | 'OFF'): Promise<void> {
    const response = await fetch(`${API_URL}/zones/${zoneId}/pump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) throw new Error('Error al controlar bomba');
  },
};

export const iotApi = {
  async verifyConnection(zoneId: number): Promise<{ connected: boolean; message: string }> {
    const response = await fetch(`${API_URL}/iot/verify-connection/${zoneId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      return { connected: false, message: 'Error de conexión' };
    }
    return response.json();
  },

  async sendCommand(zoneId: number, command: string, value?: any): Promise<void> {
    const response = await fetch(`${API_URL}/iot/send-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId, command, value }),
    });
    if (!response.ok) throw new Error('Error al enviar comando');
  },
};

export const eventsApi = {
  async getEvents(userId: number, options?: { limit?: number; zoneId?: number; type?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.zoneId) params.append('zoneId', options.zoneId.toString());
    if (options?.type) params.append('type', options.type);

    const response = await fetch(`${API_URL}/events/${userId}?${params}`);
    if (!response.ok) throw new Error('Error al obtener eventos');
    return response.json();
  },

  async getStatistics(userId: number, options?: { days?: number; zoneId?: number }): Promise<any> {
    const params = new URLSearchParams();
    if (options?.days) params.append('days', options.days.toString());
    if (options?.zoneId) params.append('zoneId', options.zoneId.toString());

    const response = await fetch(`${API_URL}/events/${userId}/statistics?${params}`);
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    return response.json();
  },

  async deleteEvents(userId: number, olderThanDays?: number): Promise<{ deleted: number }> {
    const params = olderThanDays ? `?olderThan=${olderThanDays}` : '';
    const response = await fetch(`${API_URL}/events/${userId}${params}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar eventos');
    return response.json();
  },
};
