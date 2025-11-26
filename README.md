# 🌱 AgroMind - Sistema de Riego Inteligente

Sistema IoT de monitoreo y control automático de riego con múltiples zonas, integración meteorológica y dashboard en tiempo real.

![AgroMind Dashboard](https://img.shields.io/badge/Status-Active-success)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Características

### 🎯 Gestión Multi-Zona
- **Zonas Independientes**: Outdoor, Indoor, Greenhouse
- **Configuración Individual**: Cada zona tiene su propio umbral de riego y configuración
- **Creación/Eliminación**: Gestiona tus zonas fácilmente desde el dashboard

### 📊 Monitoreo en Tiempo Real
- **Sensores IoT**:
  - 💧 Humedad del suelo
  - 🌡️ Temperatura ambiente
  - 💦 Nivel de tanque de agua
  - ☀️ Nivel de luz
  - 💨 Humedad relativa
- **Simulación IoT**: Generación de datos realistas con variaciones aleatorias

### 🌦️ Integración Meteorológica
- **API OpenWeatherMap**: Datos climáticos en tiempo real
- **Por Zona**: Activa/desactiva la integración por zona
- **Predicción Inteligente**: Previene riego si hay lluvia pronosticada
- **Ideal para**: Zonas outdoor (desactivar para indoor/greenhouse)

### 🤖 Riego Automático
- **Modo Auto**: Activa la bomba cuando la humedad cae del umbral
- **Respeta Lluvia**: Si hay pronóstico de lluvia, cancela el riego (configurable)
- **Control Manual**: Toma el control cuando lo necesites
- **Notificaciones**: Alertas de tanque bajo, riegos completados

### 🎨 Interfaz Moderna
- **React 19 + Vite**: Rendimiento ultrarrápido
- **Tailwind CSS v4**: Diseño responsive y moderno
- **Modo Oscuro**: Cambia entre tema claro/oscuro
- **Animaciones Fluidas**: Transiciones suaves y visuales atractivos

### 🔐 Multi-Usuario
- **Autenticación Completa**: Login, registro, recuperación de contraseña
- **Datos Aislados**: Cada usuario ve solo sus zonas
- **Sesión Persistente**: "Recordarme" con localStorage

## 🛠️ Stack Tecnológico

### Frontend
- **React 19**: Biblioteca UI moderna
- **TypeScript**: Tipado estático
- **Vite**: Build tool ultrarrápido
- **Tailwind CSS v4**: Framework CSS utility-first
- **Lucide React**: Iconos SVG
- **React Router**: Navegación SPA

### Backend
- **Node.js 18**: Runtime JavaScript
- **Express**: Framework web minimalista
- **TypeScript**: Código backend tipado
- **Sequelize**: ORM para PostgreSQL
- **CORS**: Manejo de peticiones cross-origin

### Base de Datos
- **PostgreSQL 15**: Base de datos relacional
- **Docker Volume**: Persistencia de datos

### DevOps
- **Docker Compose**: Orquestación de contenedores
- **Nginx**: Servidor web para frontend
- **Multi-stage Build**: Optimización de imágenes

## 📦 Instalación

### Prerrequisitos
- Docker & Docker Compose
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/agromind.git
cd agromind
```

2. **Levantar los contenedores**
```bash
docker-compose up --build -d
```

3. **Acceder a la aplicación**
- Frontend (opcional/local): http://localhost:3000
- Backend (Render): https://agromind-5hb1.onrender.com
- Base de datos (Render PostgreSQL): provista vía `DATABASE_URL`

### Usuario de Prueba
```
Email: test@agromind.com
Password: test123
```

## 🎮 Uso

### Crear una Nueva Zona
1. Click en el dropdown de zonas (arriba izquierda)
2. Click en "Nueva Zona"
3. Ingresa nombre y tipo (Outdoor/Indoor/Greenhouse)
4. Click en "Crear Zona"

### Configurar Riego por Zona
1. Ve a **Configuración** desde el menú lateral
2. Selecciona la zona a configurar
3. Ajusta:
   - **Umbral de humedad**: % mínimo antes de regar
   - **Usar API de Clima**: Activar/desactivar integración meteorológica
   - **Respetar lluvia**: Cancelar riego si hay pronóstico de lluvia

### Modo Automático
1. En el dashboard, activa el switch "Modo Auto"
2. El sistema regará automáticamente cuando:
   - La humedad caiga del umbral configurado
   - El tanque tenga suficiente agua
   - No haya pronóstico de lluvia (si está activado)

### Eliminar Zona
1. Click en el dropdown de zonas
2. Click en el ícono de basura 🗑️ junto a la zona
3. Confirma la eliminación

## 🏗️ Arquitectura

```
agromind/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── context/         # Context API (Auth, Theme)
│   │   ├── pages/           # Páginas principales
│   │   ├── services/        # API calls, weather service
│   │   └── types/           # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── config/          # Database config
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API endpoints
│   │   └── index.ts         # Entry point
│   └── Dockerfile
│
├── docker-compose.yml        # Orquestación de servicios
└── README.md
```

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

### Zones
- `GET /api/zones/:userId` - Obtener zonas del usuario
- `POST /api/zones` - Crear nueva zona
- `PUT /api/zones/:id` - Actualizar zona
- `DELETE /api/zones/:id` - Eliminar zona

## 🐳 Docker

### Servicios
- **frontend**: React app servido por Nginx (puerto 3000)
- **backend**: API Node.js (puerto 5000)
- **db**: PostgreSQL 15 (puerto 5432)

### Comandos Útiles
```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir imágenes
docker-compose up --build -d

# Limpiar todo (incluye volumen de DB)
docker-compose down -v
```

## 🧪 Desarrollo

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## 📝 Modelos de Datos

### User
```typescript
{
  id: number;
  email: string;
  password: string;
  name: string;
}
```

### Zone
```typescript
{
  id: number;
  userId: number;
  name: string;
  type: 'Outdoor' | 'Indoor' | 'Greenhouse';
  sensors: {
    soilMoisture: number;
    tankLevel: number;
    temperature: number;
    humidity: number;
    lightLevel: number;
  };
  status: {
    pump: 'ON' | 'OFF';
    connection: 'ONLINE' | 'OFFLINE';
    lastWatered: string;
  };
  config: {
    moistureThreshold: number;
    wateringDuration: number;
    autoMode: boolean;
    respectRainForecast: boolean;
    useWeatherApi: boolean;
  };
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

Desarrollado con 💚 para la gestión inteligente de recursos hídricos

## 🙏 Agradecimientos

- [OpenWeatherMap](https://openweathermap.org/) - API meteorológica
- [Lucide Icons](https://lucide.dev/) - Iconos SVG
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
