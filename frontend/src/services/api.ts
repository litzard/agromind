export const API_URL = import.meta.env.VITE_API_URL || 'https://agromind-5hb1.onrender.com/api';

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
};

export const zonesApi = {
  async getZones(userId: number) {
    const response = await fetch(`${API_URL}/zones/${userId}`);
    if (!response.ok) throw new Error('Error al obtener zonas');
    return response.json();
  },

  async createZone(zoneData: any) {
    const response = await fetch(`${API_URL}/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zoneData),
    });
    if (!response.ok) throw new Error('Error al crear zona');
    return response.json();
  },

  async updateZone(id: number, zoneData: any) {
    const response = await fetch(`${API_URL}/zones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zoneData),
    });
    if (!response.ok) throw new Error('Error al actualizar zona');
    return response.json();
  },

  async deleteZone(id: number) {
    const response = await fetch(`${API_URL}/zones/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar zona');
    return response.json();
  },
};
