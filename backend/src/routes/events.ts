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
        const irrigationEvents = events.filter(e => 
            e.type.includes('RIEGO') || e.type === 'IRRIGATION'
        );
        
        const autoIrrigations = events.filter(e => 
            e.type === 'RIEGO_AUTO' || e.type === 'AUTO_IRRIGATION'
        );

        const manualIrrigations = events.filter(e => 
            e.type === 'RIEGO_MANUAL_INICIO' || e.type === 'MANUAL_IRRIGATION'
        );

        const configChanges = events.filter(e => 
            e.type === 'CONFIG_CAMBIO' || e.type === 'CONFIG_CHANGE'
        );

        // Calcular agua usada (estimado basado en duración de riego)
        let totalWaterUsed = 0;
        let waterSaved = 0;

        irrigationEvents.forEach(event => {
            const metadata = event.metadata as any;
            const duration = metadata?.duration || metadata?.wateringDuration || 30;
            // Estimación: 0.5 litros por segundo
            totalWaterUsed += duration * 0.5;
        });

        // Obtener zonas para calcular ahorros potenciales
        const zones = await Zone.findAll({ 
            where: zoneId 
                ? { id: parseInt(zoneId as string) }
                : { userId: parseInt(userId) }
        });

        zones.forEach(zone => {
            const config = zone.config as any;
            if (config?.weatherAdjust) {
                // Si tiene ajuste por clima, estimar 15% de ahorro
                waterSaved += totalWaterUsed * 0.15;
            }
        });

        // Agrupar riegos por día para gráfico
        const irrigationsByDay: { [key: string]: number } = {};
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            last7Days.push(key);
            irrigationsByDay[key] = 0;
        }

        irrigationEvents.forEach(event => {
            const day = event.createdAt.toISOString().split('T')[0];
            if (irrigationsByDay[day] !== undefined) {
                irrigationsByDay[day]++;
            }
        });

        // Formatear para gráfico
        const dailyIrrigations = last7Days.map(day => ({
            date: day,
            day: new Date(day).toLocaleDateString('es-ES', { weekday: 'short' }),
            count: irrigationsByDay[day] || 0
        }));

        // Calcular promedios
        const avgDailyIrrigations = irrigationEvents.length / parseInt(days as string);
        const avgWaterPerDay = totalWaterUsed / parseInt(days as string);

        res.json({
            summary: {
                totalIrrigations: irrigationEvents.length,
                autoIrrigations: autoIrrigations.length,
                manualIrrigations: manualIrrigations.length,
                configChanges: configChanges.length,
                totalWaterUsed: Math.round(totalWaterUsed * 10) / 10,
                waterSaved: Math.round(waterSaved * 10) / 10,
                avgDailyIrrigations: Math.round(avgDailyIrrigations * 10) / 10,
                avgWaterPerDay: Math.round(avgWaterPerDay * 10) / 10,
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
