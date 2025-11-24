import express from 'express';
import Zone from '../models/Zone';

const router = express.Router();

// ESP32 envía datos de sensores
router.post('/sensor-data/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { soilMoisture, temperature, humidity, lightLevel, tankLevel } = req.body;

    const zone = await Zone.findByPk(zoneId);
    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    // Actualizar sensores
    const currentSensors = zone.sensors as any;
    const updatedSensors = {
      ...currentSensors,
      soilMoisture: soilMoisture ?? currentSensors.soilMoisture,
      temperature: temperature ?? currentSensors.temperature,
      humidity: humidity ?? currentSensors.humidity,
      lightLevel: lightLevel ?? currentSensors.lightLevel,
      tankLevel: tankLevel ?? currentSensors.tankLevel,
    };

    await zone.update({ sensors: updatedSensors });

    res.json({ 
      success: true, 
      message: 'Datos actualizados',
      sensors: updatedSensors 
    });
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

export default router;
