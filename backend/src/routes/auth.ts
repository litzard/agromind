import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

// Registro
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Crear usuario (en producción deberías hashear la contraseña con bcrypt)
    const user = await User.create({ email, password, name });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
