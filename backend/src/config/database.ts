import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

// Cargar variables de entorno si estamos en local
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'agromind_local',     // Nombre de la base de datos
  process.env.DB_USER || 'postgres',           // Usuario
  process.env.DB_PASSWORD || 'password',       // Contraseña
  {
    host: process.env.DB_HOST || 'localhost',  // Host (en la nube será el dpg-...)
    dialect: 'postgres',
    logging: false, // Ponlo en true si quieres ver las consultas SQL en la consola
    dialectOptions: {
      // Esta configuración es CRÍTICA para Render (SSL)
      ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? {
        require: true,
        rejectUnauthorized: false 
      } : false
    },
  }
);

export default sequelize;