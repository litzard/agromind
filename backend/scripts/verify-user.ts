import sequelize from '../src/config/database';
import User from '../src/models/User';

const emailToVerify = process.argv[2];

if (!emailToVerify) {
  console.log('Uso: npx ts-node scripts/verify-user.ts email@ejemplo.com');
  process.exit(1);
}

async function verifyUser() {
  try {
    await sequelize.authenticate();
    console.log('✓ Conectado a la base de datos');

    const user = await User.findOne({ where: { email: emailToVerify } });
    
    if (!user) {
      console.log(`✗ Usuario con email "${emailToVerify}" no encontrado`);
      return;
    }

    if (user.isVerified) {
      console.log(`→ El usuario "${user.name}" ya está verificado`);
      return;
    }

    await user.update({
      isVerified: true,
      verificationCode: null,
      verificationExpires: null
    });

    console.log(`✓ Usuario "${user.name}" (${user.email}) verificado exitosamente`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

verifyUser();
