import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'agormind_db', // Nombre con el error de dedo (o el que corregiste)
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      // ESTO ES LO QUE TE FALTA PARA QUE RENDER NO MATE TU APP
      ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com')
        ? {
            require: true,
            rejectUnauthorized: false
          }
        : false
    },
  }
);

export default sequelize;