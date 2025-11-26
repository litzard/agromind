import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

const isRenderConnection = Boolean(process.env.DATABASE_URL);

const sequelize = isRenderConnection
  ? new Sequelize(process.env.DATABASE_URL as string, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    })
  : new Sequelize(
      process.env.DB_NAME || 'agromind_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'password',
      {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: false,
      }
    );

export default sequelize;