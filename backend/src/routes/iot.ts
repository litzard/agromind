import express from 'express';
import Zone from '../models/Zone';
import Event from '../models/Event';

const router = express.Router();

// Constante de flujo de la bomba: 120 litros/hora = 0.0333 litros/segundo
const PUMP_FLOW_RATE_LPS = 120 / 3600; // 0.0333... L/s

// Helper para crear eventos
const createEvent = async (userId: number, zoneId: number, type: string, description: string, metadata?: object) => {
  try {
    await Event.create({ userId, zoneId, type, description, metadata });
  } catch (error) {
    console.error('Error creating event:', error);
  }
};

// Calcular litros usados basado en duración en segundos
const calculateWaterUsed = (durationSeconds: number): number => {
  return Math.round(durationSeconds * PUMP_FLOW_RATE_LPS * 100) / 100;
};

// Calcular offset de timezone basado en longitud (cada 15° = 1 hora)
const getTimezoneOffsetFromLongitude = (longitude: number): number => {
  return Math.round(longitude / 15);
};

// Obtener hora local basada en la ubicación de la zona
const getLocalTime = (config: any): Date => {
  const now = new Date();
  
  if (config?.location?.lon) {
    const offsetHours = getTimezoneOffsetFromLongitude(config.location.lon);
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    return new Date(utcTime + (offsetHours * 60 * 60 * 1000));
  }
  
  // Fallback: México (UTC-6)
  const mexicoOffset = -6;
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  return new Date(utcTime + (mexicoOffset * 60 * 60 * 1000));
};

// Verificar si un horario programado debe ejecutarse ahora
const shouldTriggerSchedule = (schedules: any[], config: any): { shouldTrigger: boolean; schedule: any | null } => {
  if (!schedules || schedules.length === 0) return { shouldTrigger: false, schedule: null };
  
  const localTime = getLocalTime(config);
  const currentDay = localTime.getDay();
  const currentHour = localTime.getHours();
  const currentMinute = localTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  console.log(`[SCHEDULE] Hora local: ${currentHour}:${currentMinute.toString().padStart(2, '0')} Día: ${currentDay}`);
  
  for (const schedule of schedules) {
    if (!schedule.enabled) continue;
    if (!schedule.days || !schedule.days.includes(currentDay)) continue;
    
    const [schedHour, schedMin] = schedule.time.split(':').map(Number);
    const schedTotalMinutes = schedHour * 60 + schedMin;
    const diff = Math.abs(currentTotalMinutes - schedTotalMinutes);
    
    if (diff <= 2) {
      console.log(`[SCHEDULE] ✓ Coincide: ${schedule.time} (diff: ${diff}min)`);
      return { shouldTrigger: true, schedule };
    }
  }
  
  return { shouldTrigger: false, schedule: null };
};

// ESP32 envía datos de sensores
router.post('/sensor-data', async (req, res) => {
  try {
    const { zoneId, sensors } = req.body;

    if (!zoneId || !sensors) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const zone = await Zone.findByPk(zoneId);
    if (!zone) {
      return res.status(404).json({ 
        error: 'Zona no encontrada',
        pairingRequired: true 
      });
    }

    const currentStatus = (zone.status as any) || {};
    const currentSensors = (zone.sensors as any) || {};
    const config = (zone.config as any) || {};
    
    const manualPumpCommand = currentStatus.manualPumpCommand;

    const updatedSensors = {
      ...currentSensors,
      temperature: sensors.temperature ?? currentSensors.temperature,
      soilMoisture: sensors.soilMoisture ?? currentSensors.soilMoisture,
      waterLevel: sensors.waterLevel ?? currentSensors.waterLevel,
      lightLevel: sensors.lightLevel ?? currentSensors.lightLevel,
      tankLevel: sensors.waterLevel ?? currentSensors.tankLevel,
      humidity: sensors.humidity ?? currentSensors.humidity,
    };

    let pumpStatus: 'ON' | 'OFF' | 'LOCKED' = sensors.pumpStatus ? 'ON' : 'OFF';
    const tankLevel = updatedSensors.tankLevel ?? 100;

    if (tankLevel <= 5) {
      pumpStatus = 'LOCKED';
    }

    let autoWaterCommand: boolean | null = null;
    const soilMoisture = updatedSensors.soilMoisture ?? 100;
    const moistureThreshold = config.moistureThreshold ?? 30;
    const schedules = config.schedules || [];
    
    if (pumpStatus !== 'LOCKED' && tankLevel > 5) {
      
      if (config.autoMode && soilMoisture < moistureThreshold) {
        if (currentStatus.pump !== 'ON') {
          console.log(`[AUTO] Riego automático: humedad ${soilMoisture}% < umbral ${moistureThreshold}%`);
          autoWaterCommand = true;
        }
      } 
      else if (config.autoMode && soilMoisture >= moistureThreshold + 5 && currentStatus.pump === 'ON' && !manualPumpCommand) {
        console.log(`[AUTO] Riego detenido: humedad ${soilMoisture}% alcanzada`);
        autoWaterCommand = false;
      }
      
      // Verificar horarios programados
      const scheduleCheck = shouldTriggerSchedule(schedules, config);
      if (scheduleCheck.shouldTrigger) {
        const lastTrigger = currentStatus.lastScheduleTrigger ? new Date(currentStatus.lastScheduleTrigger).getTime() : 0;
        const cooldownMs = 5 * 60 * 1000; // 5 minutos
        
        if (currentStatus.pump !== 'ON' && (Date.now() - lastTrigger) > cooldownMs) {
          console.log(`[SCHEDULE] Iniciando riego: ${scheduleCheck.schedule?.time}`);
          autoWaterCommand = true;
        }
      }
    }

    const updatedStatus: any = {
      ...currentStatus,
      connection: 'ONLINE',
      lastUpdate: new Date().toISOString(),
      pump: pumpStatus,
      hasSensorData: true,
      manualPumpCommand: manualPumpCommand,
      lastScheduleTrigger: autoWaterCommand === true ? new Date().toISOString() : currentStatus.lastScheduleTrigger,
      totalWaterUsed: currentStatus.totalWaterUsed || 0,
    };

    const previousPumpStatus = currentStatus.pump;
    const pumpChanged = previousPumpStatus !== pumpStatus;

    if (pumpStatus === 'ON' && previousPumpStatus !== 'ON') {
      updatedStatus.pumpStartTime = new Date().toISOString();
    }

    let waterUsedThisSession = 0;
    if (pumpStatus !== 'ON' && previousPumpStatus === 'ON' && currentStatus.pumpStartTime) {
      const startTime = new Date(currentStatus.pumpStartTime).getTime();
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      waterUsedThisSession = calculateWaterUsed(durationSeconds);
      
      updatedStatus.totalWaterUsed = (currentStatus.totalWaterUsed || 0) + waterUsedThisSession;
      updatedStatus.lastWatered = new Date().toISOString();
      updatedStatus.lastWateringDuration = Math.round(durationSeconds);
      updatedStatus.lastWateringLiters = waterUsedThisSession;
      updatedStatus.pumpStartTime = null;
      
      console.log(`[WATER] Riego: ${durationSeconds.toFixed(1)}s = ${waterUsedThisSession}L`);
    }

    await zone.update({
      sensors: updatedSensors,
      status: updatedStatus
    });

    if (pumpChanged && zone.userId) {
      if (pumpStatus === 'ON') {
        const eventType = config.autoMode ? 'RIEGO_AUTO_INICIO' : 'RIEGO_MANUAL';
        await createEvent(
          zone.userId, zone.id, eventType,
          `Riego ${config.autoMode ? 'automático' : 'manual'} iniciado en ${zone.name}`,
          { soilMoisture, threshold: moistureThreshold, automatic: config.autoMode }
        );
      } else if (pumpStatus === 'OFF' && previousPumpStatus === 'ON') {
        await createEvent(
          zone.userId, zone.id, config.autoMode ? 'RIEGO_AUTO_FIN' : 'RIEGO_FIN',
          `Riego finalizado en ${zone.name}: ${waterUsedThisSession}L`,
          { 
            automatic: config.autoMode, 
            durationSeconds: updatedStatus.lastWateringDuration,
            litersUsed: waterUsedThisSession,
            totalWaterUsed: updatedStatus.totalWaterUsed
          }
        );
      } else if (pumpStatus === 'LOCKED') {
        await createEvent(
          zone.userId, zone.id, 'ALERTA_TANQUE',
          `Bomba bloqueada: tanque vacío (${tankLevel}%)`,
          { tankLevel }
        );
      }
    }

    let finalPumpCommand: boolean | null = null;
    
    if (manualPumpCommand !== undefined) {
      finalPumpCommand = manualPumpCommand;
    } else if (autoWaterCommand !== null) {
      finalPumpCommand = autoWaterCommand;
    }

    const response: any = {
      success: true,
      commands: {
        pumpState: finalPumpCommand,
        autoMode: config.autoMode || false,
        moistureThreshold: moistureThreshold,
        wateringDuration: config.wateringDuration || 10,
        tankLocked: pumpStatus === 'LOCKED'
      }
    };

    if (manualPumpCommand !== undefined) {
      await zone.update({ 
        status: { ...updatedStatus, manualPumpCommand: undefined } 
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Error actualizando sensores:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

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

    const tankLevel = sensors.tankLevel ?? 100;
    const isLocked = tankLevel <= 5;
    const manualPumpCommand = status.manualPumpCommand;

    const response: any = {
      zoneId,
      pumpState: manualPumpCommand !== undefined ? manualPumpCommand : null,
      autoMode: config.autoMode || false,
      moistureThreshold: config.moistureThreshold || 30,
      wateringDuration: config.wateringDuration || 10,
      tankLocked: isLocked,
      currentPumpStatus: status.pump
    };

    if (manualPumpCommand !== undefined) {
      await zone.update({ 
        status: { ...status, manualPumpCommand: undefined } 
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Error obteniendo comandos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

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

router.get('/health', async (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'Agromind IoT'
  });
});

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
        status: { ...status, connection: 'OFFLINE' }
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
