import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import authRoutes from './routes/auth';
import zoneRoutes from './routes/zones';
import iotRoutes from './routes/iot';
import eventRoutes from './routes/events';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const publicApiUrl = process.env.PUBLIC_API_URL || 'https://agromind-5hb1.onrender.com';

// Middleware
app.use(cors());
app.use(express.json());

// Test DB Connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // Sincronizar modelos con la base de datos
    // alter: true agregará las columnas nuevas sin borrar datos
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados con la base de datos.');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
    setTimeout(connectDB, 5000); // Reintentar en 5 segundos
  }
};

connectDB();

// Routes
app.get('/', (req, res) => {
  res.send('Agromind API Running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/events', eventRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
  console.log(`📡 Para datos ESP32: POST ${publicApiUrl}/api/iot/sensor-data`);
  console.log(`📥 Para comandos ESP32: GET ${publicApiUrl}/api/iot/commands/:zoneId`);
});
