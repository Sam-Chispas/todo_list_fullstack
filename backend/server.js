const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================
// CONFIGURACIÓN CORS COMPLETA
// ============================================

// Lista de orígenes permitidos - INCLUYE TU DOMINIO NETLIFY
const allowedOrigins = [
    'https://graceful-cat-836f5c.netlify.app',  // TU DOMINIO NETLIFY ACTUAL
    'https://todo-app-sam-chispas.netlify.app',  // Si tienes otro
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:8080'
];

// Configurar CORS
const corsOptions = {
    origin: '*', function (origin, callback) {
        // Permitir requests sin origen
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('🔒 Origen bloqueado por CORS:', origin);
            // Para desarrollo temporal, descomentar la línea de abajo:
            // callback(null, true);  // PERMITIR TODOS TEMPORALMENTE
            callback(new Error('Origen no permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Aplicar middleware CORS
app.use(cors(corsOptions));

// Manejar preflight OPTIONS requests
app.options('*', cors(corsOptions));

// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

let dbConnected = false;

// Verificar conexión a la base de datos
(async () => {
    try {
        await pool.query('SELECT 1');
        dbConnected = true;
        console.log('✅ Base de datos: Conectada');
    } catch (err) {
        dbConnected = false;
        console.error('❌ Error conectando a la base de datos:', err.message);
    }
})();

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
});

// ============================================
// RUTA RAIZ (SOLO API)
// ============================================
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Todo Backend API funcionando',
        service: 'API REST para aplicación To-Do List',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            apiHealth: 'GET /api/health',
            getTodos: 'GET /api/todos',
            createTodo: 'POST /api/todos',
            updateTodo: 'PATCH /api/todos/:id',
            deleteTodo: 'DELETE /api/todos/:id',
            clearCompleted: 'DELETE /api/todos/clear-completed',
            initDb: 'GET /api/init-db'
        },
        frontend: 'https://graceful-cat-836f5c.netlify.app',
        database: dbConnected ? 'connected' : 'disconnected'
    });
});

// ============================================
// HEALTH CHECKS
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Todo Backend API',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        cors: 'enabled'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API funcionando correctamente',
        database: dbConnected ? 'conectada' : 'desconectada',
        cors: 'habilitado',
        frontend_url: 'https://graceful-cat-836f5c.netlify.app',
        endpoints: [
            'GET    /api/todos',
            'POST   /api/todos',
            'PATCH  /api/todos/:id',
            'DELETE /api/todos/:id',
            'DELETE /api/todos/clear-completed'
        ]
    });
});

// ============================================
// API ROUTES
// ============================================

// GET todas las tareas
app.get('/api/todos', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({ 
            error: 'Base de datos no disponible',
            useLocalStorage: true 
        });
    }
    
    try {
        const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo tareas:', err);
        res.status(500).json({ 
            error: 'Error obteniendo tareas',
            message: err.message 
        });
    }
});

// POST nueva tarea
app.post('/api/todos', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({ 
            error: 'Base de datos no disponible',
            useLocalStorage: true 
        });
    }
    
    const { text, completed = false } = req.body;
    
    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'El texto de la tarea es requerido' });
    }
    
    try {
        const result = await pool.query(
            'INSERT INTO todos (text, completed) VALUES ($1, $2) RETURNING *',
            [text.trim(), completed]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creando tarea:', err);
        res.status(500).json({ 
            error: 'Error creando tarea',
            message: err.message
        });
    }
});

// PATCH actualizar tarea
app.patch('/api/todos/:id', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({ 
            error: 'Base de datos no disponible',
            useLocalStorage: true 
        });
    }
    
    const { id } = req.params;
    const { text, completed } = req.body;
    
    if (text !== undefined && text.trim() === '') {
        return res.status(400).json({ error: 'El texto de la tarea no puede estar vacío' });
    }
    
    try {
        const todoCheck = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
        if (todoCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (text !== undefined) {
            updates.push(`text = $${paramCount}`);
            values.push(text.trim());
            paramCount++;
        }
        
        if (completed !== undefined) {
            updates.push(`completed = $${paramCount}`);
            values.push(completed);
            paramCount++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }
        
        values.push(id);
        const query = `UPDATE todos SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        
        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error actualizando tarea:', err);
        res.status(500).json({ 
            error: 'Error actualizando tarea',
            message: err.message
        });
    }
});

// DELETE tarea
app.delete('/api/todos/:id', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({ 
            error: 'Base de datos no disponible',
            useLocalStorage: true 
        });
    }
    
    const { id } = req.params;
    
    try {
        const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.json({ 
            message: 'Tarea eliminada correctamente',
            deleted: result.rows[0]
        });
    } catch (err) {
        console.error('Error eliminando tarea:', err);
        res.status(500).json({ 
            error: 'Error eliminando tarea',
            message: err.message
        });
    }
});

// DELETE tareas completadas
app.delete('/api/todos/clear-completed', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({ 
            error: 'Base de datos no disponible',
            useLocalStorage: true 
        });
    }
    
    try {
        const activeTodos = await pool.query('SELECT * FROM todos WHERE completed = FALSE ORDER BY created_at DESC');
        await pool.query('DELETE FROM todos WHERE completed = TRUE');
        res.json(activeTodos.rows);
    } catch (err) {
        console.error('Error eliminando tareas completadas:', err);
        res.status(500).json({ 
            error: 'Error eliminando tareas completadas',
            message: err.message
        });
    }
});

// ============================================
// RUTA DE INICIALIZACIÓN (para desarrollo)
// ============================================
app.get('/api/init-db', async (req, res) => {
    if (!dbConnected) {
        return res.status(503).json({ 
            error: 'Base de datos no disponible' 
        });
    }
    
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                text TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insertar datos de ejemplo
        await pool.query(`
            INSERT INTO todos (text, completed) VALUES
            ('Aprender Full Stack', false),
            ('Desplegar en la nube', false),
            ('Completar proyecto To-Do', true)
            ON CONFLICT DO NOTHING
        `);
        
        res.json({ 
            success: true,
            message: 'Base de datos inicializada exitosamente',
            table: 'todos creada/verificada',
            sampleData: '3 tareas insertadas'
        });
    } catch (error) {
        console.error('Error inicializando BD:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error inicializando base de datos',
            message: error.message
        });
    }
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Ruta API no encontrada',
        message: `La ruta ${req.method} ${req.path} no existe`,
        availableRoutes: [
            'GET  /',
            'GET  /health',
            'GET  /api/health',
            'GET  /api/todos',
            'POST /api/todos',
            'PATCH /api/todos/:id',
            'DELETE /api/todos/:id',
            'DELETE /api/todos/clear-completed',
            'GET /api/init-db'
        ]
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error general:', err);
    
    // Si es error de CORS
    if (err.message.includes('CORS') || err.message.includes('Origen')) {
        return res.status(403).json({
            error: 'CORS Error',
            message: err.message,
            allowedOrigins: allowedOrigins,
            yourOrigin: req.headers.origin || 'none',
            note: 'Para desarrollo, puedes permitir todos los orígenes temporalmente cambiando la configuración CORS'
        });
    }
    
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador'
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 BACKEND API ejecutándose en puerto ${PORT}`);
    console.log(`🌐 URL: https://todo-list-fullstack-1l3f.onrender.com`);
    console.log(`🎯 Solo API - No sirve archivos estáticos`);
    console.log(`🔗 Frontend: https://graceful-cat-836f5c.netlify.app`);
    console.log(`🔒 CORS habilitado para: ${allowedOrigins.join(', ')}`);
    console.log(`🗄️  Base de datos: ${dbConnected ? '✅ Conectada' : '❌ Desconectada'}`);
});