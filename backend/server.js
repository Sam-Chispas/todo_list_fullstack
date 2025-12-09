const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Configuración de la base de datos
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir frontend estático en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
}

// Verificar conexión a la base de datos
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack);
  } else {
    console.log('Conexión a la base de datos establecida');
    release();
  }
});

// Crear tabla si no existe
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

pool.query(createTableQuery, (err) => {
  if (err) {
    console.error('Error creando tabla:', err);
  } else {
    console.log('Tabla "todos" verificada/creada');
  }
});

// Rutas de la API

// Obtener todas las tareas
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo tareas:', err);
    res.status(500).json({ error: 'Error obteniendo tareas' });
  }
});

// Crear una nueva tarea
app.post('/api/todos', async (req, res) => {
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
    res.status(500).json({ error: 'Error creando tarea' });
  }
});

// Actualizar una tarea
app.patch('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;
  
  if (text !== undefined && text.trim() === '') {
    return res.status(400).json({ error: 'El texto de la tarea no puede estar vacío' });
  }
  
  try {
    // Verificar si la tarea existe
    const todoCheck = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Construir la consulta dinámicamente
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
    res.status(500).json({ error: 'Error actualizando tarea' });
  }
});

// Eliminar una tarea
app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    res.json({ message: 'Tarea eliminada correctamente' });
  } catch (err) {
    console.error('Error eliminando tarea:', err);
    res.status(500).json({ error: 'Error eliminando tarea' });
  }
});

// Eliminar todas las tareas completadas
app.delete('/api/todos/clear-completed', async (req, res) => {
  try {
    // Primero obtener las tareas que no están completadas
    const activeTodos = await pool.query('SELECT * FROM todos WHERE completed = FALSE ORDER BY created_at DESC');
    
    // Eliminar las completadas
    await pool.query('DELETE FROM todos WHERE completed = TRUE');
    
    res.json(activeTodos.rows);
  } catch (err) {
    console.error('Error eliminando tareas completadas:', err);
    res.status(500).json({ error: 'Error eliminando tareas completadas' });
  }
});

// Ruta para servir el frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'desarrollo'}`);
});