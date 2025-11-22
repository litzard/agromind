import { Router, Request, Response } from 'express';
import Zone from '../models/Zone';

const router = Router();

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
    const zone = await Zone.create(req.body);
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

export default router;
