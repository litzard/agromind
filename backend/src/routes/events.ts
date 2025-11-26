import express from 'express';
import Event from '../models/Event';
import { Op } from 'sequelize';

const router = express.Router();

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
