import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import authRoutes from './routes/auth';
import zoneRoutes from './routes/zones';
import User from './models/User';
import Zone from './models/Zone';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test DB Connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados con la base de datos.');
    
    // Crear usuario de prueba si no existe
    const testUser = await User.findOne({ where: { email: 'test@agromind.com' } });
    if (!testUser) {
      const user = await User.create({
        email: 'test@agromind.com',
        password: 'test123',
        name: 'Usuario de Prueba',
      });
      
      // Crear zonas de prueba
      await Zone.create({
        userId: user.id,
        name: 'Jardín Principal',
        type: 'Outdoor',
        sensors: { soilMoisture: 45, tankLevel: 80, temperature: 24, humidity: 60, lightLevel: 90 },
        status: { pump: 'OFF', connection: 'ONLINE', lastWatered: '08:30 AM' },
        config: { moistureThreshold: 30, wateringDuration: 10, autoMode: true, respectRainForecast: true, useWeatherApi: true },
      });
      
      await Zone.create({
        userId: user.id,
        name: 'Invernadero',
        type: 'Greenhouse',
        sensors: { soilMoisture: 20, tankLevel: 15, temperature: 28, humidity: 80, lightLevel: 40 },
        status: { pump: 'OFF', connection: 'ONLINE', lastWatered: 'Ayer 06:00 PM' },
        config: { moistureThreshold: 40, wateringDuration: 15, autoMode: true, respectRainForecast: false, useWeatherApi: false },
      });
      
      console.log('Usuario y zonas de prueba creados.');
    }
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

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
