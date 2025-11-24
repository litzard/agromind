import Zone from '../models/Zone';

// Simulador de datos IoT para pruebas
export class IoTSimulator {
  private intervals: Map<number, NodeJS.Timeout> = new Map();

  // Iniciar simulación para una zona
  startSimulation(zoneId: number) {
    if (this.intervals.has(zoneId)) {
      console.log(`Simulación ya activa para zona ${zoneId}`);
      return;
    }

    console.log(`🤖 Iniciando simulación IoT para zona ${zoneId}`);

    const interval = setInterval(async () => {
      try {
        const zone = await Zone.findByPk(zoneId);
        if (!zone) {
          console.log(`Zona ${zoneId} no encontrada, deteniendo simulación`);
          this.stopSimulation(zoneId);
          return;
        }

        const sensors = zone.sensors as any;
        const status = zone.status as any;
        const config = zone.config as any;

        // Simular cambios en sensores
        let { soilMoisture, tankLevel, temperature, humidity, lightLevel } = sensors;
        let { pump } = status;

        // Temperatura: variación leve
        temperature = parseFloat((temperature + (Math.random() - 0.5) * 0.5).toFixed(1));
        temperature = Math.max(15, Math.min(40, temperature)); // Entre 15-40°C

        // Humedad ambiente: variación leve
        humidity = parseFloat((humidity + (Math.random() - 0.5) * 2).toFixed(1));
        humidity = Math.max(20, Math.min(100, humidity));

        // Luz: simular día/noche (simplificado)
        const hour = new Date().getHours();
        if (hour >= 6 && hour <= 18) {
          lightLevel = Math.min(100, lightLevel + Math.random() * 5);
        } else {
          lightLevel = Math.max(0, lightLevel - Math.random() * 5);
        }
        lightLevel = Math.round(lightLevel);

        // Si la bomba está ON, aumentar humedad del suelo y bajar tanque
        if (pump === 'ON') {
          soilMoisture = Math.min(100, soilMoisture + 3);
          tankLevel = Math.max(0, tankLevel - 0.8);
        } else {
          // Secado natural
          soilMoisture = Math.max(0, soilMoisture - 0.2);
        }

        // LÓGICA DE CONTROL AUTOMÁTICO
        let nextPump = pump;

        // Bloquear si tanque vacío
        if (tankLevel <= 5) {
          if (pump !== 'LOCKED') {
            nextPump = 'LOCKED';
            console.log(`⚠️ Zona ${zoneId}: Tanque vacío, bomba bloqueada`);
          }
        } else if (pump === 'LOCKED' && tankLevel > 10) {
          nextPump = 'OFF';
          console.log(`✅ Zona ${zoneId}: Tanque recargado, bomba desbloqueada`);
        }

        // Modo automático
        if (config.autoMode && nextPump !== 'LOCKED') {
          if (soilMoisture < config.moistureThreshold && pump === 'OFF') {
            nextPump = 'ON';
            console.log(`💧 Zona ${zoneId}: Riego automático iniciado (${soilMoisture.toFixed(1)}% < ${config.moistureThreshold}%)`);
          } else if (soilMoisture > (config.moistureThreshold + 25) && pump === 'ON') {
            nextPump = 'OFF';
            console.log(`✅ Zona ${zoneId}: Riego automático detenido (${soilMoisture.toFixed(1)}% > ${config.moistureThreshold + 25}%)`);
          }
        }

        // Actualizar en BD
        await zone.update({
          sensors: {
            soilMoisture: parseFloat(soilMoisture.toFixed(1)),
            tankLevel: parseFloat(tankLevel.toFixed(1)),
            temperature,
            humidity,
            lightLevel,
          },
          status: {
            ...status,
            pump: nextPump,
            connection: 'ONLINE',
            lastWatered: nextPump === 'OFF' && pump === 'ON' 
              ? new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              : status.lastWatered,
          },
        });

      } catch (error) {
        console.error(`Error en simulación de zona ${zoneId}:`, error);
      }
    }, 2000); // Actualizar cada 2 segundos

    this.intervals.set(zoneId, interval);
  }

  // Detener simulación
  stopSimulation(zoneId: number) {
    const interval = this.intervals.get(zoneId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(zoneId);
      console.log(`⏹️ Simulación detenida para zona ${zoneId}`);
    }
  }

  // Detener todas las simulaciones
  stopAll() {
    this.intervals.forEach((interval, zoneId) => {
      clearInterval(interval);
      console.log(`⏹️ Simulación detenida para zona ${zoneId}`);
    });
    this.intervals.clear();
  }

  // Obtener zonas activas
  getActiveSimulations(): number[] {
    return Array.from(this.intervals.keys());
  }
}

export const simulator = new IoTSimulator();
