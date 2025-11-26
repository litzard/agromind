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
    const updatedStatus = {
      ...currentStatus,
      connection: 'ONLINE',
      lastUpdate: new Date().toISOString(),
      pump: sensors.pumpStatus ? 'ON' : (currentStatus.pump === 'LOCKED' ? 'LOCKED' : 'OFF'),
      hasSensorData: true
    };

    // Verificar si el tanque está muy bajo
    if (updatedSensors.tankLevel <= 5) {
      updatedStatus.pump = 'LOCKED';
    }

    await zone.update({
      sensors: updatedSensors,
      status: updatedStatus
    });

    console.log(`📡 Datos recibidos de ESP32 - Zona ${zoneId}:`, sensors);

    // Responder con comandos para el ESP32
    const config = zone.config as any;
    const response: any = {
      success: true,
      commands: {
        pumpState: updatedStatus.pump === 'ON',
        autoMode: config.autoMode || false,
        moistureThreshold: config.moistureThreshold || 30,
        wateringDuration: config.wateringDuration || 10
      }
    };

    // Si está en modo automático y la humedad es baja, activar bomba
    if (config.autoMode && updatedSensors.soilMoisture < config.moistureThreshold && updatedSensors.tankLevel > 5) {
      response.commands.pumpState = true;
      updatedStatus.pump = 'ON';
      await zone.update({ status: updatedStatus });
    }

    res.json(response);
  } catch (error) {
    console.error('Error actualizando sensores:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ESP32 obtiene comandos (qué debe hacer la bomba)
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

    // Lógica de control automático
    let pumpCommand = status.pump;

    if (config.autoMode && status.pump !== 'LOCKED') {
      // Si la humedad está bajo el umbral, encender bomba
      if (sensors.soilMoisture < config.moistureThreshold && status.pump === 'OFF') {
        pumpCommand = 'ON';
      }
      // Si la humedad está 25% arriba del umbral, apagar (histéresis)
      else if (sensors.soilMoisture > (config.moistureThreshold + 25) && status.pump === 'ON') {
        pumpCommand = 'OFF';
      }
    }

    // Bloquear si tanque vacío
    if (sensors.tankLevel <= 5) {
      pumpCommand = 'LOCKED';
    } else if (status.pump === 'LOCKED' && sensors.tankLevel > 10) {
      pumpCommand = 'OFF'; // Desbloquear
    }

    // Si el comando cambió, actualizar en BD
    if (pumpCommand !== status.pump) {
      await zone.update({ 
        status: { 
          ...status, 
          pump: pumpCommand,
          lastWatered: pumpCommand === 'OFF' && status.pump === 'ON' 
            ? new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            : status.lastWatered
        } 
      });
    }

    res.json({
      zoneId,
      pump: pumpCommand,
      autoMode: config.autoMode,
      moistureThreshold: config.moistureThreshold,
      wateringDuration: config.wateringDuration,
    });
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
