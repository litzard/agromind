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
  return Math.round(durationSeconds * PUMP_FLOW_RATE_LPS * 100) / 100; // Redondear a 2 decimales
};

// Verificar si un horario programado debe ejecutarse ahora
const shouldTriggerSchedule = (schedules: any[], sensors: any, config: any): boolean => {
  if (!schedules || schedules.length === 0) return false;
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Domingo
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  
  for (const schedule of schedules) {
    if (!schedule.enabled) continue;
    if (!schedule.days.includes(currentDay)) continue;
    
    // Verificar si la hora actual está dentro de un rango de 1 minuto del horario
    const [schedHour, schedMin] = schedule.time.split(':').map(Number);
    const [currHour, currMin] = currentTime.split(':').map(Number);
    
    const schedMinutes = schedHour * 60 + schedMin;
    const currMinutes = currHour * 60 + currMin;
    
    // Activar si estamos dentro de 1 minuto del horario programado
    if (Math.abs(currMinutes - schedMinutes) <= 1) {
      console.log(`[SCHEDULE] Horario programado activado: ${schedule.time} para día ${currentDay}`);
      return true;
    }
  }
  
  return false;
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
    
    // Capturar el comando manual ANTES de cualquier update
    const manualPumpCommand = currentStatus.manualPumpCommand;

    // Actualizar sensores con datos del ESP32
    const updatedSensors = {
      ...currentSensors,
      temperature: sensors.temperature ?? currentSensors.temperature,
      soilMoisture: sensors.soilMoisture ?? currentSensors.soilMoisture,
      waterLevel: sensors.waterLevel ?? currentSensors.waterLevel,
      lightLevel: sensors.lightLevel ?? currentSensors.lightLevel,
      tankLevel: sensors.waterLevel ?? currentSensors.tankLevel,
      humidity: sensors.humidity ?? currentSensors.humidity,
    };

    // Determinar estado de la bomba
    let pumpStatus: 'ON' | 'OFF' | 'LOCKED' = sensors.pumpStatus ? 'ON' : 'OFF';
    const tankLevel = updatedSensors.tankLevel ?? 100;

    // Evaluar bloqueo por tanque vacío
    if (tankLevel <= 5) {
      pumpStatus = 'LOCKED';
    }

    // ========================================
    // LÓGICA DE RIEGO AUTOMÁTICO Y HORARIOS
    // ========================================
    let autoWaterCommand: boolean | null = null;
    const soilMoisture = updatedSensors.soilMoisture ?? 100;
    const moistureThreshold = config.moistureThreshold ?? 30;
    const schedules = config.schedules || [];
    
    // Solo evaluar si no está bloqueado y el tanque tiene agua
    if (pumpStatus !== 'LOCKED' && tankLevel > 5) {
      
      // 1. Verificar modo automático por humedad
      if (config.autoMode && soilMoisture < moistureThreshold) {
        // La humedad está por debajo del umbral - NECESITA RIEGO
        if (currentStatus.pump !== 'ON') {
          console.log(`[AUTO] Riego automático activado: humedad ${soilMoisture}% < umbral ${moistureThreshold}%`);
          autoWaterCommand = true;
        }
      } 
      // Si la humedad ya superó el umbral + margen, apagar
      else if (config.autoMode && soilMoisture >= moistureThreshold + 5 && currentStatus.pump === 'ON' && !manualPumpCommand) {
        console.log(`[AUTO] Riego automático detenido: humedad ${soilMoisture}% alcanzada`);
        autoWaterCommand = false;
      }
      
      // 2. Verificar horarios programados
      if (shouldTriggerSchedule(schedules, updatedSensors, config)) {
        if (currentStatus.pump !== 'ON' && !currentStatus.scheduleTriggeredRecently) {
          console.log(`[SCHEDULE] Iniciando riego por horario programado`);
          autoWaterCommand = true;
        }
      }
    }

    // Construir status actualizado
    const updatedStatus: any = {
      ...currentStatus,
      connection: 'ONLINE',
      lastUpdate: new Date().toISOString(),
      pump: pumpStatus,
      hasSensorData: true,
      manualPumpCommand: manualPumpCommand,
      // Marcar si se activó un horario recientemente (para no repetir)
      scheduleTriggeredRecently: autoWaterCommand === true ? true : 
        (Date.now() - new Date(currentStatus.lastScheduleTrigger || 0).getTime() < 120000 ? true : false),
      lastScheduleTrigger: autoWaterCommand === true ? new Date().toISOString() : currentStatus.lastScheduleTrigger,
      // Rastrear consumo de agua
      totalWaterUsed: currentStatus.totalWaterUsed || 0,
    };

    // Detectar cambios de estado de bomba para registrar eventos y calcular agua
    const previousPumpStatus = currentStatus.pump;
    const pumpChanged = previousPumpStatus !== pumpStatus;

    // Si la bomba se enciende, guardar timestamp de inicio
    if (pumpStatus === 'ON' && previousPumpStatus !== 'ON') {
      updatedStatus.pumpStartTime = new Date().toISOString();
    }

    // Si la bomba se apaga, calcular agua usada
    let waterUsedThisSession = 0;
    if (pumpStatus !== 'ON' && previousPumpStatus === 'ON' && currentStatus.pumpStartTime) {
      const startTime = new Date(currentStatus.pumpStartTime).getTime();
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      waterUsedThisSession = calculateWaterUsed(durationSeconds);
      
      // Acumular al total
      updatedStatus.totalWaterUsed = (currentStatus.totalWaterUsed || 0) + waterUsedThisSession;
      updatedStatus.lastWatered = new Date().toISOString();
      updatedStatus.lastWateringDuration = Math.round(durationSeconds);
      updatedStatus.lastWateringLiters = waterUsedThisSession;
      updatedStatus.pumpStartTime = null;
      
      console.log(`[WATER] Riego finalizado: ${durationSeconds.toFixed(1)}s = ${waterUsedThisSession}L (Total: ${updatedStatus.totalWaterUsed.toFixed(2)}L)`);
    }

    await zone.update({
      sensors: updatedSensors,
      status: updatedStatus
    });

    // Registrar eventos con datos de agua
    if (pumpChanged && zone.userId) {
      if (pumpStatus === 'ON') {
        const eventType = config.autoMode ? 'RIEGO_AUTO_INICIO' : 'RIEGO_MANUAL';
        await createEvent(
          zone.userId, zone.id, eventType,
          `Riego ${config.autoMode ? 'automático' : 'manual'} iniciado en ${zone.name}${config.autoMode ? ` (humedad: ${soilMoisture}%)` : ''}`,
          { soilMoisture, threshold: moistureThreshold, automatic: config.autoMode }
        );
      } else if (pumpStatus === 'OFF' && previousPumpStatus === 'ON') {
        await createEvent(
          zone.userId, zone.id, config.autoMode ? 'RIEGO_AUTO_FIN' : 'RIEGO_FIN',
          `Riego finalizado en ${zone.name}: ${waterUsedThisSession}L usados`,
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
          `Bomba bloqueada en ${zone.name}: tanque vacío (${tankLevel}%)`,
          { tankLevel }
        );
      }
    }

    // ========================================
    // RESPUESTA AL ESP32
    // ========================================
    // Prioridad: 1) Comando manual, 2) Comando automático/horario, 3) null (firmware decide)
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

    // Limpiar comando manual después de enviarlo
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
