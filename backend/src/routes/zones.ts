import { Router, Request, Response } from 'express';
import Zone from '../models/Zone';

const router = Router();

// Obtener una zona específica (por ID)
router.get('/detail/:id', async (req: Request, res: Response) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }
    res.json(zone);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener zonas de un usuario
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const zones = await Zone.findAll({ where: { userId: req.params.userId } });
    res.json(zones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear zona
router.post('/', async (req: Request, res: Response) => {
  try {
    const defaultSensors = {
      soilMoisture: null,
      temperature: null,
      humidity: null,
      lightLevel: null,
      tankLevel: null,
      waterLevel: null,
    };

    const defaultStatus = {
      pump: 'OFF',
      connection: 'OFFLINE',
      lastWatered: 'Nunca',
      lastUpdate: null,
      hasSensorData: false,
    };

    const payload = {
      ...req.body,
      sensors: req.body.sensors ?? defaultSensors,
      status: req.body.status ? { ...defaultStatus, ...req.body.status } : defaultStatus,
    };

    const zone = await Zone.create(payload);
    res.status(201).json(zone);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar zona
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }
    await zone.update(req.body);
    res.json(zone);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar zona
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }
    await zone.destroy();
    res.json({ message: 'Zona eliminada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Control manual de bomba (para apps)
router.post('/:id/pump', async (req: Request, res: Response) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    const { action } = req.body; // "ON" | "OFF"
    const status = zone.status as any;
    const sensors = zone.sensors as any;

    // Validar que no esté bloqueada
    if (status.pump === 'LOCKED' && action === 'ON') {
      return res.status(400).json({ 
        error: 'Bomba bloqueada por tanque vacío',
        tankLevel: sensors.tankLevel 
      });
    }

    // Validar nivel de tanque
    if (sensors.tankLevel <= 5 && action === 'ON') {
      return res.status(400).json({ 
        error: 'Nivel de tanque muy bajo',
        tankLevel: sensors.tankLevel 
      });
    }

    // Guardar como comando manual pendiente para que el ESP32 lo reciba
    // El ESP32 ejecutará el comando y reportará el estado real
    const newManualCommand = action === 'ON';
    
    await zone.update({ 
      status: { 
        ...status, 
        manualPumpCommand: newManualCommand,
        lastWatered: action === 'OFF' && status.pump === 'ON' 
          ? new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : status.lastWatered
      } 
    });

    console.log(`💧 Comando de bomba guardado - Zona ${req.params.id}: manualPumpCommand=${newManualCommand}`);

    res.json({ success: true, pump: action, pending: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
