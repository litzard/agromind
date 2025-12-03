import { Resend } from 'resend';

const resend = new Resend('re_amZifW8e_9zuXwQGpVsaNYj7Xa9fby8rB');

const FROM_EMAIL = 'AgroMind <onboarding@resend.dev>';

// Generar código de verificación de 6 dígitos
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generar token para reset de contraseña
export const generateResetToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Enviar email de verificación de cuenta
export const sendVerificationEmail = async (
  email: string,
  name: string,
  code: string
): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: '🌱 Verifica tu cuenta de AgroMind',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); padding: 16px; border-radius: 16px; margin-bottom: 16px;">
                <span style="font-size: 32px;">🌱</span>
              </div>
              <h1 style="color: #111827; font-size: 28px; margin: 0;">AgroMind</h1>
              <p style="color: #6b7280; margin-top: 8px;">Sistema Inteligente de Riego</p>
            </div>
            
            <!-- Card -->
            <div style="background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px 0;">¡Hola ${name}! 👋</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Gracias por registrarte en AgroMind. Para completar tu registro y comenzar a automatizar tu riego, ingresa el siguiente código de verificación:
              </p>
              
              <!-- Code Box -->
              <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 2px solid #10b981; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: #059669; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Tu código de verificación:</p>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #047857; font-family: monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                Este código expira en <strong>15 minutos</strong>. Si no solicitaste esta verificación, puedes ignorar este correo.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} AgroMind. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error enviando email de verificación:', error);
      return false;
    }

    console.log('Email de verificación enviado:', data?.id);
    return true;
  } catch (error) {
    console.error('Error en sendVerificationEmail:', error);
    return false;
  }
};

// Enviar email de recuperación de contraseña
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  code: string
): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: '🔐 Recupera tu contraseña de AgroMind',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); padding: 16px; border-radius: 16px; margin-bottom: 16px;">
                <span style="font-size: 32px;">🔐</span>
              </div>
              <h1 style="color: #111827; font-size: 28px; margin: 0;">AgroMind</h1>
              <p style="color: #6b7280; margin-top: 8px;">Recuperación de Contraseña</p>
            </div>
            
            <!-- Card -->
            <div style="background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px 0;">Hola ${name},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código para crear una nueva contraseña:
              </p>
              
              <!-- Code Box -->
              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: #b45309; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Tu código de recuperación:</p>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #92400e; font-family: monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                Este código expira en <strong>15 minutos</strong>.
              </p>
              
              <div style="background: #fef2f2; border-radius: 12px; padding: 16px;">
                <p style="color: #991b1b; font-size: 13px; margin: 0;">
                  ⚠️ Si no solicitaste este cambio, ignora este correo. Tu contraseña permanecerá igual.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} AgroMind. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error enviando email de recuperación:', error);
      return false;
    }

    console.log('Email de recuperación enviado:', data?.id);
    return true;
  } catch (error) {
    console.error('Error en sendPasswordResetEmail:', error);
    return false;
  }
};

// Enviar email de confirmación de cambio de contraseña
export const sendPasswordChangedEmail = async (
  email: string,
  name: string
): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: '✅ Tu contraseña ha sido cambiada - AgroMind',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); padding: 16px; border-radius: 16px; margin-bottom: 16px;">
                <span style="font-size: 32px;">✅</span>
              </div>
              <h1 style="color: #111827; font-size: 28px; margin: 0;">AgroMind</h1>
            </div>
            
            <!-- Card -->
            <div style="background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <div style="background: #ecfdf5; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">🔒</span>
                <h2 style="color: #047857; font-size: 20px; margin: 16px 0 0 0;">Contraseña Actualizada</h2>
              </div>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Hola ${name}, tu contraseña ha sido cambiada exitosamente.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                Si no realizaste este cambio, contacta con soporte inmediatamente.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} AgroMind. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error enviando confirmación:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en sendPasswordChangedEmail:', error);
    return false;
  }
};

export default {
  generateVerificationCode,
  generateResetToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
