# 🌱 AgroMind - Sistema de Riego Inteligente

Sistema IoT de monitoreo y control automático de riego con múltiples zonas, integración meteorológica y aplicación móvil multiplataforma.

![AgroMind](https://img.shields.io/badge/Status-Active-success)
![Render](https://img.shields.io/badge/Render-Deployed-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Características

### 🎯 Gestión Multi-Zona
- **Zonas Independientes**: Outdoor, Indoor, Greenhouse
- **Configuración Individual**: Cada zona tiene su propio umbral de riego y configuración
- **Pairing ESP32**: Vincula dispositivos ESP32 a zonas desde la app móvil

### 📊 Monitoreo en Tiempo Real
- **Sensores IoT (ESP32)**:
  - 💧 Humedad del suelo (sensor capacitivo)
  - 🌡️ Temperatura ambiente (DHT11)
  - 💦 Nivel de tanque de agua (HC-SR04 ultrasónico)
  - ☀️ Nivel de luz (LDR)
  - 💨 Humedad relativa (DHT11)

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

### 📱 Aplicación Móvil
- **Multiplataforma**: iOS y Android con React Native + Expo
- **Modo Oscuro**: Cambia entre tema claro/oscuro
- **Tiempo Real**: Dashboard actualizado con datos de sensores
- **Configuración**: Gestiona zonas y ESP32 desde la app

### 🔐 Multi-Usuario
- **Autenticación Completa**: Login, registro, recuperación de contraseña
- **Datos Aislados**: Cada usuario ve solo sus zonas
- **Sesión Persistente**: Mantén tu sesión activa

## 🛠️ Stack Tecnológico

### Mobile App
- **React Native + Expo**: Framework multiplataforma
- **TypeScript**: Tipado estático
- **Expo Router**: Navegación basada en archivos
- **React Native Paper**: Componentes UI
- **AsyncStorage**: Persistencia local

### Backend (Render Cloud)
- **Node.js 18 + Express**: API REST
- **TypeScript**: Código tipado
- **Sequelize ORM**: Manejo de base de datos
- **PostgreSQL 15**: Base de datos (Render)
- **CORS**: Manejo de peticiones cross-origin

### Hardware IoT
- **ESP32 (ESP-IDF)**: Microcontrolador WiFi
- **Sensores**:
  - DHT11: Temperatura y humedad
  - Sensor capacitivo: Humedad de suelo
  - HC-SR04: Nivel de agua (ultrasonido)
  - LDR: Sensor de luz
- **Actuadores**:
  - Relé para bomba de agua

### Cloud & DevOps
- **Render**: Hosting de backend y PostgreSQL
- **HTTPS**: Comunicación segura ESP32 → Backend
- **NVS Storage**: Configuración persistente en ESP32

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- Expo CLI (para mobile)
- ESP-IDF 5.x (para hardware)
- Git

### 🔐 Configuración de Secretos

> ⚠️ **IMPORTANTE**: Antes de ejecutar el proyecto, debes configurar las variables de entorno

#### 1. Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de Render y OpenWeather API
```

#### 2. Mobile App
```bash
cd mobile
cp .env.example .env
# Editar .env con tu URL del backend
```

#### 3. ESP32

> ⚠️ **Nota v1.0**: La configuración WiFi del ESP32 requiere compilación manual. 
> Versiones futuras incluirán provisioning vía Bluetooth desde la app móvil.

```bash
cd esp32-idf
cp config.example.h config.h
# Editar config.h con tu WiFi y calibraciones
```

**Configuración requerida en `config.h`:**
- `WIFI_SSID`: Nombre de tu red WiFi (debe ser 2.4GHz)
- `WIFI_PASS`: Contraseña de tu red WiFi
- `SERVER_URL`: URL del backend (por defecto Render)
- Calibraciones de sensores (opcional, valores por defecto incluidos)

### Pasos de Instalación

#### Backend (Local)
```bash
cd backend
npm install
npm run dev    # Puerto 5000
```

#### Mobile App
```bash
cd mobile
npm install
npx expo start
# Escanear QR code con Expo Go
```

#### ESP32 (ESP-IDF)
Ver [ESP32_INTEGRATION.md](./ESP32_INTEGRATION.md) para instrucciones detalladas.

### URLs de Acceso
- **Backend (Render)**: https://agromind-5hb1.onrender.com/api
- **Mobile**: Escanear QR con Expo Go
- **ESP32 Local Server**: http://{esp32-ip}:80

### Usuario de Prueba
```
Email: test@agromind.com
Password: test123
```

## 🎮 Uso

### 1. Crear una Nueva Zona (desde la App)
1. Abrir app móvil y hacer login
2. Tap en el botón "+"
3. Completar nombre y tipo (Outdoor/Indoor/Greenhouse)
4. Guardar zona

### 2. Vincular ESP32 a una Zona
1. Conectar ESP32 a la misma red WiFi
2. En la app, ir a la zona recién creada
3. Tap en "Vincular Dispositivo"
4. La app descubre el ESP32 automáticamente
5. Confirmar pairing
6. El ESP32 comienza a enviar datos

### 3. Configurar Riego Automático
1. Ir a **Configuración** desde la zona
2. Ajustar:
   - **Umbral de humedad**: % mínimo antes de regar
   - **Duración de riego**: Segundos de riego
   - **Usar API de Clima**: Activar/desactivar integración meteorológica
   - **Respetar lluvia**: Cancelar riego si hay pronóstico de lluvia

### 4. Activar Modo Automático
1. En el dashboard de la zona, activar switch "Modo Auto"
2. El sistema regará automáticamente cuando:
   - La humedad caiga del umbral configurado
   - El tanque tenga suficiente agua
   - No haya pronóstico de lluvia (si está activado)

### 5. Control Manual
- Usar el botón de bomba en la app para encender/apagar manualmente
- El modo manual tiene prioridad sobre el automático

## 🏗️ Arquitectura

```
agromind/
├── mobile/                  # React Native + Expo
│   ├── app/                # Rutas y pantallas (Expo Router)
│   │   ├── (tabs)/        # Navegación principal
│   │   ├── login.tsx
│   │   ├── add-zone.tsx
│   │   └── ...
│   ├── components/         # Componentes reutilizables
│   ├── context/           # Context API (Auth, Theme)
│   ├── services/          # API client, Weather
│   ├── .env.example       # Template de configuración
│   └── package.json
│
├── backend/                # Node.js + Express (Render)
│   ├── src/
│   │   ├── config/        # Database config
│   │   ├── models/        # Sequelize models (User, Zone)
│   │   ├── routes/        # API endpoints
│   │   │   ├── auth.ts
│   │   │   ├── zones.ts
│   │   │   └── iot.ts
│   │   └── index.ts
│   ├── .env.example
│   └── package.json
│
├── esp32-idf/             # ESP-IDF para ESP32
│   ├── main/
│   │   └── main.cpp       # Código principal (1022 líneas)
│   ├── components/        # Componentes ESP-IDF
│   ├── config.example.h   # Template de configuración
│   ├── CMakeLists.txt
│   └── sdkconfig
│
├── docs/
│   └── architecture.md    # Diagrama y detalles técnicos
│
├── .gitignore
├── README.md
├── ESP32_INTEGRATION.md
└── TESTING_GUIDE.md
```

Ver [diagrama completo de arquitectura](./docs/architecture.md)

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

### Zones
- `GET /api/zones/:userId` - Obtener zonas del usuario
- `POST /api/zones` - Crear nueva zona
- `PUT /api/zones/:id` - Actualizar zona
- `DELETE /api/zones/:id` - Eliminar zona

### IoT
- `POST /api/iot/sensor-data` - Recibir datos del ESP32

## 🧪 Desarrollo

### Backend
```bash
cd backend
npm install
npm run dev    # http://localhost:5000
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### ESP32
```bash
cd esp32-idf
idf.py build
idf.py flash
idf.py monitor
```

## 📝 Modelos de Datos

### User
```typescript
{
  id: number;
  email: string;
  password: string; // Hasheado
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
    soilMoisture: number;       // 0-100%
    tankLevel: number;          // 0-100%
    temperature: number;        // °C
    humidity: number;           // 0-100%
    lightLevel: number;         // 0-100%
  };
  status: {
    pump: 'ON' | 'OFF';
    connection: 'ONLINE' | 'OFFLINE';
    lastWatered: string;        // ISO date
  };
  config: {
    moistureThreshold: number;  // %
    wateringDuration: number;   // segundos
    autoMode: boolean;
    respectRainForecast: boolean;
    useWeatherApi: boolean;
  };
}
```

## 🔒 Seguridad

- ✅ Variables de entorno para secretos
- ✅ Templates `.env.example` versionados
- ✅ `.gitignore` protege archivos sensibles
- ✅ HTTPS entre ESP32 y backend
- ✅ Autenticación JWT
- ⚠️ ESP32 pairing local (HTTP en red privada)

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
- [Expo](https://expo.dev/) - Framework React Native
- [Render](https://render.com/) - Cloud hosting
- [ESP-IDF](https://docs.espressif.com/projects/esp-idf/) - Framework ESP32

## 📚 Documentación Adicional

- [ESP32 Integration Guide](./ESP32_INTEGRATION.md) - Configuración de hardware
- [Testing Guide](./TESTING_GUIDE.md) - Guía de pruebas
- [Architecture Diagram](./docs/architecture.md) - Diagrama detallado

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
