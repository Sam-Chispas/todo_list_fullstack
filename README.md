---

# 📝 To-Do List — Full Stack Application

Una aplicación completa de lista de tareas con **frontend**, **backend** y **base de datos**, desplegada en la nube con las mejores prácticas.

---

## ✨ Características

* ✅ **Frontend elegante** inspirado en diseño de CodePen
* 🔄 **Backend RESTful API** con Node.js + Express
* 🗄️ **Base de datos PostgreSQL** (almacenamiento persistente)
* 📱 **Responsive (mobile-first)**
* 🌐 **Despliegue en Netlify + Render + Railway**
* 💾 **Fallback a LocalStorage** si el backend no responde
* 🎨 **Interfaz moderna**, animaciones suaves
* 🔍 **Filtros de tareas** (Todas / Pendientes / Completadas)
* 📊 **Estadísticas en tiempo real**
* ✏️ **Edición inline** de tareas

---

## 🚀 Demo en Vivo

🔗 **Repositorio:** [https://github.com/Sam-Chispas/todo_list_fullstack](https://github.com/Sam-Chispas/todo_list_fullstack)

---

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Netlify      │────▶│     Render      │────▶│    Railway      │
│   (Frontend)    │     │    (Backend)    │     │   (Database)    │
│   React/Vanilla │     │  Node.js/Express│     │   PostgreSQL    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                           API REST
```

---

## 📁 Estructura del Proyecto

```
todo_list_fullstack/
├── frontend/                    
│   ├── index.html           
│   ├── styles.css           
│   └── app.js               
│
├── backend/                    
│   ├── server.js           
│   ├── package.json       
│   ├── .env.example        
│   └── start.sh            
│
├── database/                  
│   └── init.sql             
│
├── netlify.toml              
├── .gitignore               
└── README.md                
```

---

## 🛠️ Tecnologías Utilizadas

### 🖥️ **Frontend**

* HTML5
* CSS3 (Flexbox, Grid, Animaciones)
* JavaScript (ES6+)
* Font Awesome
* Google Fonts (Poppins)

### 🧠 **Backend**

* Node.js
* Express.js
* PostgreSQL
* CORS
* dotenv

### ☁️ **Infraestructura**

* Netlify → Frontend
* Render → Backend
* Railway → PostgreSQL
* GitHub → Control de versiones

---

## 🚀 Despliegue Rápido

### 🔧 Prerrequisitos

* Git
* Node.js 16+
* Cuentas en Netlify, Render y Railway

---

### **📌 Paso 1: Clonar Repositorio**

```bash
git clone https://github.com/Sam-Chispas/todo_list_fullstack.git
cd todo_list_fullstack
```

---

### **🐘 Paso 2: Base de Datos (Railway)**

1. Crear cuenta en Railway
2. Crear proyecto → Database → PostgreSQL
3. Copiar tu `DATABASE_URL`

---

### **🛠️ Paso 3: Backend (Render)**

1. Crear cuenta
2. New → Web Service → Importar desde GitHub
3. Configurar:

| Campo             | Valor                          |
| ----------------- | ------------------------------ |
| **Name**          | `todo-backend`                 |
| **Environment**   | Node                           |
| **Build Command** | `cd backend && npm install`    |
| **Start Command** | `cd backend && node server.js` |

4. Añadir variables de entorno:

```
NODE_ENV=production
DATABASE_URL=tu_url_de_railway
```

5. Deploy
6. Guardar URL del backend

---

### **🌐 Paso 4: Frontend (Netlify)**

1. Importar proyecto desde GitHub
2. Configuración:

| Campo                 | Valor      |
| --------------------- | ---------- |
| **Build command**     | *(vacío)*  |
| **Publish directory** | `frontend` |

3. Variables de entorno:

```
API_URL = https://tu-backend.onrender.com
```

---

### **🎯 Paso 5 (Opcional): Proxy en Netlify**

Archivo: `/frontend/_redirects`

```
/api/* https://tu-backend.onrender.com/api/:splat 200
```

---

## 💻 Desarrollo Local

### **1. Instalar dependencias**

```bash
cd backend
npm install
cp .env.example .env
```

Editar `.env` con tus datos.

---

### **2. Base de datos local**

#### Opción A — PostgreSQL

```bash
createdb todo_db
psql -d todo_db -f database/init.sql
```

#### Opción B — SQLite (simple)

```bash
npm install sqlite3
```

*(Modificar server.js)*

---

### **3. Ejecutar App**

```bash
# Backend
cd backend
npm run dev

# Frontend
npx live-server frontend
```

---

## 🔧 Variables de Entorno

### **Backend (.env)**

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://usuario:password@localhost:5432/todo_db
```

### **Frontend (app.js)**

```javascript
this.apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://tu-backend.onrender.com/api/todos'
  : 'http://localhost:3000/api/todos';
```

---

## 📚 API Endpoints

| Método | Endpoint                     | Descripción        |
| ------ | ---------------------------- | ------------------ |
| GET    | `/api/todos`                 | Obtener tareas     |
| POST   | `/api/todos`                 | Crear tarea        |
| PATCH  | `/api/todos/:id`             | Actualizar tarea   |
| DELETE | `/api/todos/:id`             | Eliminar tarea     |
| DELETE | `/api/todos/clear-completed` | Borrar completadas |

### **Ejemplo**

```json
{
  "id": 1,
  "text": "Aprender Full Stack",
  "completed": false,
  "created_at": "2024-01-01T10:00:00.000Z"
}
```

---

## 🐛 Problemas Comunes

### ❌ Backend no disponible

* Revisar logs de Render
* Verificar variables de entorno
* Railway puede hibernar en plan gratuito

### ❌ No conecta a DB

* Verificar `DATABASE_URL`
* Confirmar que Railway esté "awake"

### ❌ CORS en local

```js
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
```

---

## 🔄 Flujo de Trabajo con Git

```bash
git clone https://github.com/Sam-Chispas/todo_list_fullstack.git
git checkout -b feature/nueva-funcionalidad
git add .
git commit -m "Descripción de cambios"
git push origin feature/nueva-funcionalidad
```

---

## 🤝 Contribuciones

1. Hacer **Fork**
2. Crear rama
3. Subir cambios
4. Abrir Pull Request

---

## 👏 Créditos

* Diseño inspirado en CodePen de **shshaw**
* Iconos: **Font Awesome**
* Fuentes: **Google Fonts**
* Hosting: **Netlify, Render, Railway**

---
