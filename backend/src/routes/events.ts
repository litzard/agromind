import express from 'express';
import Event from '../models/Event';
import Zone from '../models/Zone';
import { Op, fn, col, literal } from 'sequelize';

const router = express.Router();

// GET /api/events/:userId/statistics - Obtener estadísticas agregadas
router.get('/:userId/statistics', async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 30, zoneId } = req.query;

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

        const where: any = { 
            userId: parseInt(userId),
            createdAt: { [Op.gte]: daysAgo }
        };

        if (zoneId) {
            where.zoneId = parseInt(zoneId as string);
        }

        // Obtener todos los eventos del período
        const events = await Event.findAll({
            where,
            order: [['createdAt', 'DESC']],
        });

        // Calcular estadísticas
        const irrigationStartEvents = events.filter(e => 
            e.type === 'RIEGO_AUTO_INICIO' || 
            e.type === 'RIEGO_MANUAL_INICIO' ||
            e.type === 'RIEGO_MANUAL'
        );
        
        const irrigationEndEvents = events.filter(e => 
            e.type === 'RIEGO_AUTO_FIN' || 
            e.type === 'RIEGO_MANUAL_FIN' ||
            e.type === 'RIEGO_FIN'
        );
        
        const autoIrrigations = events.filter(e => 
            e.type === 'RIEGO_AUTO_INICIO'
        );

        const manualIrrigations = events.filter(e => 
            e.type === 'RIEGO_MANUAL_INICIO' || e.type === 'RIEGO_MANUAL'
        );

        const configChanges = events.filter(e => 
            e.type === 'CONFIG_CAMBIO' || e.type === 'SCHEDULES_UPDATED'
        );

        const tankAlerts = events.filter(e => e.type === 'ALERTA_TANQUE');

        // Calcular agua usada desde los eventos de fin de riego (tienen los litros reales)
        let totalWaterUsed = 0;
        let totalDurationSeconds = 0;

        irrigationEndEvents.forEach(event => {
            const metadata = event.metadata as any;
            if (metadata?.litersUsed) {
                totalWaterUsed += metadata.litersUsed;
            }
            if (metadata?.durationSeconds) {
                totalDurationSeconds += metadata.durationSeconds;
            }
        });

        // Si no hay datos de litros en eventos, obtener de la zona
        if (totalWaterUsed === 0) {
            const zones = await Zone.findAll({ 
                where: zoneId 
                    ? { id: parseInt(zoneId as string) }
                    : { userId: parseInt(userId) }
            });
            
            zones.forEach(zone => {
                const status = zone.status as any;
                if (status?.totalWaterUsed) {
                    totalWaterUsed += status.totalWaterUsed;
                }
            });
        }

        // Agrupar riegos por día para gráfico (usar el rango de días seleccionado)
        const irrigationsByDay: { [key: string]: number } = {};
        const daysToShow = parseInt(days as string);
        const lastDays = [];
        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            lastDays.push(key);
            irrigationsByDay[key] = 0;
        }

        irrigationStartEvents.forEach(event => {
            const day = event.createdAt.toISOString().split('T')[0];
            if (irrigationsByDay[day] !== undefined) {
                irrigationsByDay[day]++;
            }
        });

        // Formatear para gráfico - agrupar si son muchos días
        let dailyIrrigations;
        if (daysToShow <= 7) {
            // Mostrar días individuales
            dailyIrrigations = lastDays.map(day => ({
                date: day,
                day: new Date(day).toLocaleDateString('es-ES', { weekday: 'short' }),
                count: irrigationsByDay[day] || 0
            }));
        } else {
            // Agrupar en períodos (máximo 7-10 barras)
            const groupSize = Math.ceil(daysToShow / 7);
            dailyIrrigations = [];
            for (let g = 0; g < 7; g++) {
                const startIdx = g * groupSize;
                const endIdx = Math.min(startIdx + groupSize, lastDays.length);
                const groupDays = lastDays.slice(startIdx, endIdx);
                if (groupDays.length === 0) break;
                const groupTotal = groupDays.reduce((sum, day) => sum + (irrigationsByDay[day] || 0), 0);
                const startDate = new Date(groupDays[0]);
                dailyIrrigations.push({
                    date: groupDays[0],
                    day: `${startDate.getDate()}/${startDate.getMonth() + 1}`,
                    count: groupTotal
                });
            }
        }

        // Calcular promedios
        const totalIrrigations = irrigationStartEvents.length;
        const avgDailyIrrigations = totalIrrigations / parseInt(days as string);
        const avgWaterPerDay = totalWaterUsed / parseInt(days as string);

        // Calcular tiempo total en minutos
        const totalDurationMinutes = Math.round(totalDurationSeconds / 60);

        res.json({
            summary: {
                totalIrrigations,
                autoIrrigations: autoIrrigations.length,
                manualIrrigations: manualIrrigations.length,
                configChanges: configChanges.length,
                tankAlerts: tankAlerts.length,
                totalWaterUsed: Math.round(totalWaterUsed * 100) / 100,
                totalDurationMinutes,
                avgDailyIrrigations: Math.round(avgDailyIrrigations * 10) / 10,
                avgWaterPerDay: Math.round(avgWaterPerDay * 100) / 100,
            },
            dailyIrrigations,
            recentEvents: events.slice(0, 10).map(e => ({
                id: e.id,
                type: e.type,
                description: e.description,
                timestamp: e.createdAt,
                zoneId: e.zoneId,
            })),
            period: {
                days: parseInt(days as string),
                from: daysAgo.toISOString(),
                to: new Date().toISOString(),
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// GET /api/events/:userId - Obtener eventos del usuario
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0, zoneId, type } = req.query;

        const where: any = { userId: parseInt(userId) };
        
        if (zoneId) {
            where.zoneId = parseInt(zoneId as string);
        }
        
        if (type) {
            where.type = type;
        }

        const events = await Event.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
        });

        // Formatear respuesta
        const formattedEvents = events.map(event => ({
            id: event.id,
            type: event.type,
            description: event.description,
            timestamp: event.createdAt,
            zoneId: event.zoneId,
            metadata: event.metadata,
        }));

        res.json(formattedEvents);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Error al obtener eventos' });
    }
});

// POST /api/events - Crear evento
router.post('/', async (req, res) => {
    try {
        const { userId, zoneId, type, description, metadata } = req.body;

        if (!userId || !zoneId || !type || !description) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const event = await Event.create({
            userId,
            zoneId,
            type,
            description,
            metadata,
        });

        res.status(201).json({
            id: event.id,
            type: event.type,
            description: event.description,
            timestamp: event.createdAt,
            zoneId: event.zoneId,
            metadata: event.metadata,
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Error al crear evento' });
    }
});

// DELETE /api/events/:userId - Limpiar eventos del usuario
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { olderThan } = req.query;

        const where: any = { userId: parseInt(userId) };

        // Si se especifica, solo eliminar eventos más antiguos que X días
        if (olderThan) {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(olderThan as string));
            where.createdAt = { [Op.lt]: daysAgo };
        }

        const deleted = await Event.destroy({ where });

        res.json({ deleted });
    } catch (error) {
        console.error('Error deleting events:', error);
        res.status(500).json({ error: 'Error al eliminar eventos' });
    }
});

export default router;
