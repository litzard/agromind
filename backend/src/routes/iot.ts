import express from 'express';
import Zone from '../models/Zone';

const router = express.Router();

// ESP32 envía datos de sensores
router.post('/sensor-data', async (req, res) => {
  try {
    const { zoneId, sensors } = req.body;

    if (!zoneId || !sensors) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const zone = await Zone.findByPk(zoneId);
    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    const currentStatus = (zone.status as any) || {};
    const currentSensors = (zone.sensors as any) || {};

    // Actualizar sensores con datos del ESP32
    const updatedSensors = {
      ...currentSensors,
      temperature: sensors.temperature ?? currentSensors.temperature,
      soilMoisture: sensors.soilMoisture ?? currentSensors.soilMoisture,
      waterLevel: sensors.waterLevel ?? currentSensors.waterLevel,
      lightLevel: sensors.lightLevel ?? currentSensors.lightLevel,
      tankLevel: sensors.waterLevel ?? currentSensors.tankLevel, // waterLevel = tankLevel
      humidity: sensors.humidity ?? currentSensors.humidity,
    };

    // Actualizar estado de conexión
    // El estado de la bomba viene del ESP32 (fuente de verdad del hardware)
    let pumpStatus: 'ON' | 'OFF' | 'LOCKED' = sensors.pumpStatus ? 'ON' : 'OFF';

    // Evaluar bloqueo basándose SIEMPRE en el nivel actual del tanque
    if (updatedSensors.tankLevel <= 5) {
      pumpStatus = 'LOCKED';
    }
    // Si estaba bloqueado pero el tanque ya tiene agua suficiente, desbloquear
    // (el ESP32 reportará el estado real de la bomba)

    const updatedStatus = {
      ...currentStatus,
      connection: 'ONLINE',
      lastUpdate: new Date().toISOString(),
      pump: pumpStatus,
      hasSensorData: true
    };

    await zone.update({
      sensors: updatedSensors,
      status: updatedStatus
    });

    console.log(`📡 Datos recibidos de ESP32 - Zona ${zoneId}:`, sensors);

    // Responder con comandos para el ESP32
    // El backend NO controla la bomba en modo automático - solo informa la configuración
    // El firmware decide cuándo encender/apagar basándose en sus lecturas locales
    const config = zone.config as any;
    
    // Solo enviar comando de bomba si hay un comando manual pendiente
    // (cuando el usuario presiona el botón desde la app)
    const manualPumpCommand = currentStatus.manualPumpCommand;
    
    const response: any = {
      success: true,
      commands: {
        // Solo enviar pumpState si hay comando manual, de lo contrario null para que el firmware decida
        pumpState: manualPumpCommand !== undefined ? manualPumpCommand : null,
        autoMode: config.autoMode || false,
        moistureThreshold: config.moistureThreshold || 30,
        wateringDuration: config.wateringDuration || 10,
        tankLocked: updatedStatus.pump === 'LOCKED'
      }
    };

    // Limpiar comando manual después de enviarlo
    if (manualPumpCommand !== undefined) {
      await zone.update({ 
        status: { 
          ...updatedStatus, 
          manualPumpCommand: undefined 
        } 
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Error actualizando sensores:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ESP32 obtiene comandos (endpoint alternativo, principalmente para polling)
router.get('/commands/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;

    const zone = await Zone.findByPk(zoneId);
    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    const status = zone.status as any;
    const config = zone.config as any;
    const sensors = zone.sensors as any;

    // Evaluar si debe estar bloqueado basándose en nivel actual
    const tankLevel = sensors.tankLevel ?? 100;
    const isLocked = tankLevel <= 5;

    // Verificar si hay comando manual pendiente
    const manualPumpCommand = status.manualPumpCommand;

    const response: any = {
      zoneId,
      // Solo enviar pumpState si hay comando manual pendiente
      pumpState: manualPumpCommand !== undefined ? manualPumpCommand : null,
      autoMode: config.autoMode || false,
      moistureThreshold: config.moistureThreshold || 30,
      wateringDuration: config.wateringDuration || 10,
      tankLocked: isLocked,
      currentPumpStatus: status.pump
    };

    // Limpiar comando manual después de enviarlo
    if (manualPumpCommand !== undefined) {
      await zone.update({ 
        status: { 
          ...status, 
          manualPumpCommand: undefined 
        } 
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Error obteniendo comandos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ESP32 reporta estado de conexión (heartbeat)
router.post('/heartbeat/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;

    const zone = await Zone.findByPk(zoneId);
    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    const status = zone.status as any;
    await zone.update({ 
      status: { 
        ...status, 
        connection: 'ONLINE',
        lastSeen: new Date().toISOString()
      } 
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error en heartbeat:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Health check endpoint para el ESP32
router.get('/health', async (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'Agromind IoT'
  });
});

// Obtener estado de conexión de un ESP32
router.get('/connection-status/:zoneId', async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.zoneId);
    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    const status = zone.status as any;
    const lastUpdate = new Date(status.lastUpdate || 0);
    const now = new Date();
    const timeDiff = (now.getTime() - lastUpdate.getTime()) / 1000;

    const isOnline = timeDiff < 30;

    if (!isOnline && status.connection !== 'OFFLINE') {
      await zone.update({
        status: {
          ...status,
          connection: 'OFFLINE'
        }
      });
    }

    res.json({
      connected: isOnline,
      lastUpdate: status.lastUpdate,
      secondsSinceLastUpdate: Math.round(timeDiff)
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
