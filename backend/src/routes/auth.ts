import { Router, Request, Response } from 'express';
import User from '../models/User';
import emailService from '../services/emailService';

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

    // Generar código de verificación
    const verificationCode = emailService.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Crear usuario (en producción deberías hashear la contraseña con bcrypt)
    const user = await User.create({ 
      email, 
      password, 
      name,
      isVerified: false,
      verificationCode,
      verificationExpires,
    });

    // Enviar email de verificación
    const emailSent = await emailService.sendVerificationEmail(email, name, verificationCode);

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      emailSent,
      message: emailSent 
        ? 'Usuario creado. Revisa tu correo para verificar tu cuenta.' 
        : 'Usuario creado, pero hubo un problema enviando el email.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar cuenta con código
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'La cuenta ya está verificada' });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ error: 'Código de verificación inválido' });
    }

    if (user.verificationExpires && new Date() > user.verificationExpires) {
      return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
    }

    // Verificar usuario
    await user.update({
      isVerified: true,
      verificationCode: null,
      verificationExpires: null,
    });

    res.json({
      success: true,
      message: 'Cuenta verificada exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: true,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reenviar código de verificación
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'La cuenta ya está verificada' });
    }

    // Generar nuevo código
    const verificationCode = emailService.generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.update({ verificationCode, verificationExpires });

    const emailSent = await emailService.sendVerificationEmail(email, user.name, verificationCode);

    res.json({
      success: emailSent,
      message: emailSent ? 'Código reenviado' : 'Error al enviar el código'
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

    // Verificar si la cuenta está verificada
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Cuenta no verificada',
        needsVerification: true,
        email: user.email
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Solicitar recuperación de contraseña
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Por seguridad, no revelar si el email existe
      return res.json({ 
        success: true, 
        message: 'Si el correo existe, recibirás un código de recuperación.' 
      });
    }

    // Generar código de recuperación
    const resetCode = emailService.generateVerificationCode();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await user.update({ resetCode, resetExpires });

    const emailSent = await emailService.sendPasswordResetEmail(email, user.name, resetCode);

    res.json({
      success: true,
      message: 'Si el correo existe, recibirás un código de recuperación.',
      emailSent
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar código de recuperación
router.post('/verify-reset-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.resetCode || user.resetCode !== code) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    if (user.resetExpires && new Date() > user.resetExpires) {
      return res.status(400).json({ error: 'El código ha expirado' });
    }

    res.json({ success: true, message: 'Código válido' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Restablecer contraseña
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.resetCode || user.resetCode !== code) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    if (user.resetExpires && new Date() > user.resetExpires) {
      return res.status(400).json({ error: 'El código ha expirado' });
    }

    // Actualizar contraseña y limpiar código
    await user.update({
      password: newPassword, // En producción: hashear con bcrypt
      resetCode: null,
      resetExpires: null,
    });

    // Enviar confirmación
    await emailService.sendPasswordChangedEmail(email, user.name);

    res.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
