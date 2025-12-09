📝 To-Do List Full Stack Application
Una aplicación completa de lista de tareas con frontend, backend y base de datos, desplegada en la nube.

✨ Características
✅ Frontend elegante basado en diseño de CodePen

🔄 Backend RESTful API con Node.js y Express

🗄️ Base de datos PostgreSQL para almacenamiento persistente

📱 Totalmente responsivo (mobile-first design)

🌐 Despliegue en la nube (Netlify + Render + Railway)

💾 Fallback a almacenamiento local si el backend está offline

🎨 Interfaz moderna con animaciones y efectos

🔍 Filtrado de tareas (Todas / Pendientes / Completadas)

📊 Estadísticas en tiempo real de tareas

✏️ Edición en línea de tareas

🚀 Demo en Vivo
Repositorio: https://github.com/Sam-Chispas/todo_list_fullstack

🏗️ Arquitectura
text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Netlify      │────▶│     Render      │────▶│    Railway      │
│   (Frontend)    │     │    (Backend)    │     │   (Database)    │
│   React/Vanilla │     │  Node.js/Express│     │   PostgreSQL    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                          API REST
📁 Estructura del Proyecto
text
todo_list_fullstack/
├── frontend/                    # Interfaz de usuario
│   ├── index.html              # HTML principal
│   ├── styles.css              # Estilos CSS
│   └── app.js                  # Lógica JavaScript
│
├── backend/                    # Servidor API
│   ├── server.js              # Servidor Express
│   ├── package.json           # Dependencias Node.js
│   ├── .env                   # Variables de entorno ejemplo
│   └── start.sh               # Script de inicio
│
├── database/                   # Configuración DB
│   └── init.sql               # Scripts SQL iniciales
│
├── netlify.toml               # Configuración Netlify
├── .gitignore                 # Archivos ignorados por Git
└── README.md                  # Este archivo
🛠️ Tecnologías Utilizadas
Frontend
HTML5 - Estructura semántica

CSS3 - Estilos con Flexbox/Grid, animaciones

JavaScript (ES6+) - Lógica de la aplicación

Font Awesome - Iconos

Google Fonts - Tipografía Poppins

Backend
Node.js - Entorno de ejecución

Express.js - Framework web

PostgreSQL - Base de datos relacional

CORS - Middleware para Cross-Origin

dotenv - Gestión de variables de entorno

Infraestructura
Netlify - Hosting frontend estático

Render - Hosting backend Node.js

Railway - Base de datos PostgreSQL

GitHub - Control de versiones

🚀 Despliegue Rápido
Prerrequisitos
Git

Node.js (v16+)

GitHub Account

Cuentas en Netlify, Render, Railway

Paso 1: Clonar el Repositorio
bash
git clone https://github.com/Sam-Chispas/todo_list_fullstack.git
cd todo_list_fullstack
Paso 2: Desplegar Base de Datos (Railway)
Crear cuenta en Railway

Crear nuevo proyecto → "Database" → "PostgreSQL"

Copiar la DATABASE_URL generada automáticamente

Paso 3: Desplegar Backend (Render)
Crear cuenta en Render

"New +" → "Web Service" → Conectar repositorio GitHub

Configurar:

Name: todo-backend

Environment: Node

Build Command: cd backend && npm install

Start Command: cd backend && node server.js

Añadir variables de entorno:

NODE_ENV = production

DATABASE_URL = (URL de Railway)

Deploy y copiar la URL del backend (ej: https://todo-backend.onrender.com)

Paso 4: Desplegar Frontend (Netlify)
Crear cuenta en Netlify

"Add new site" → "Import an existing project" → GitHub

Seleccionar repositorio

Configurar:

Build command: (dejar vacío)

Publish directory: frontend

En "Site settings" → "Environment variables":

API_URL = (URL de tu backend en Render)

Deploy

Paso 5: Configurar Proxy (Opcional)
Para evitar problemas CORS, añadir en Netlify _redirects:

text
/api/* https://tu-backend.onrender.com/api/:splat 200
💻 Desarrollo Local
1. Configurar entorno
bash
# Clonar repositorio
git clone https://github.com/Sam-Chispas/todo_list_fullstack.git
cd todo_list_fullstack/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
2. Base de datos local (Opciones)
Opción A: PostgreSQL local
bash
# Instalar PostgreSQL
# Crear base de datos
createdb todo_db

# Ejecutar script inicial
psql -d todo_db -f database/init.sql
Opción B: SQLite (más simple)
bash
# Modificar backend/server.js para usar SQLite
# npm install sqlite3
3. Ejecutar aplicación
bash
# Iniciar backend
cd backend
npm run dev
# Servidor en: http://localhost:3000

# Iniciar frontend
# Abrir frontend/index.html en navegador
# O usar live-server: npx live-server frontend
🔧 Configuración de Variables de Entorno
Backend (.env)
env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/todo_db
Frontend (app.js)
javascript
// Configurar URL del backend
this.apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://tu-backend.onrender.com/api/todos'
  : 'http://localhost:3000/api/todos';
📚 API Endpoints
Método	Endpoint	Descripción
GET	/api/todos	Obtener todas las tareas
POST	/api/todos	Crear nueva tarea
PATCH	/api/todos/:id	Actualizar tarea
DELETE	/api/todos/:id	Eliminar tarea
DELETE	/api/todos/clear-completed	Eliminar completadas
Ejemplo de Tarea
json
{
  "id": 1,
  "text": "Aprender Full Stack",
  "completed": false,
  "created_at": "2024-01-01T10:00:00.000Z"
}
🐛 Solución de Problemas Comunes
Error: "Backend no disponible"
Verificar que Render esté ejecutándose

Revisar logs en Render dashboard

Verificar variables de entorno

Error: "No se puede conectar a la base de datos"
Verificar DATABASE_URL en Render

Comprobar que Railway DB esté activa

Revisar logs de Railway

Error CORS en desarrollo
javascript
// En backend/server.js
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
Límites de las plataformas gratuitas
Render: 750 horas/mes gratis

Railway: $5 crédito mensual

Netlify: 100GB/mes ancho de banda

🔄 Flujo de Trabajo con Git
bash
# Clonar proyecto
git clone https://github.com/Sam-Chispas/todo_list_fullstack.git

# Crear rama para nueva funcionalidad
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commit
git add .
git commit -m "Descripción de cambios"

# Subir a GitHub
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
🤝 Contribuir
Fork el repositorio

Crear rama de feature (git checkout -b feature/AmazingFeature)

Commit cambios (git commit -m 'Add AmazingFeature')

Push a la rama (git push origin feature/AmazingFeature)

Abrir Pull Request

👏 Agradecimientos
Diseño frontend inspirado en CodePen de shshaw

Iconos por Font Awesome

Fuentes por Google Fonts

Hosting por Netlify, Render, Railway
