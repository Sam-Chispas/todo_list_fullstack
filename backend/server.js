const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tunetlifyapp.netlify.app', 'http://localhost:5500'] 
    : '*',
  credentials: true
}));
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas de la API
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo tareas:', err);
    res.status(500).json({ error: 'Error obteniendo tareas' });
  }
});

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

app.patch('/api/todos/:id', async (req, res) => {
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
    res.status(500).json({ error: 'Error actualizando tarea' });
  }
});

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

app.delete('/api/todos/clear-completed', async (req, res) => {
  try {
    const activeTodos = await pool.query('SELECT * FROM todos WHERE completed = FALSE ORDER BY created_at DESC');
    await pool.query('DELETE FROM todos WHERE completed = TRUE');
    res.json(activeTodos.rows);
  } catch (err) {
    console.error('Error eliminando tareas completadas:', err);
    res.status(500).json({ error: 'Error eliminando tareas completadas' });
  }
});

// Ruta para crear la tabla si no existe (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/init-db', async (req, res) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          text TEXT NOT NULL,
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      res.json({ message: 'Tabla creada/verificada correctamente' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// Ruta para servir el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'desarrollo'}`);
  console.log(`Base de datos: ${process.env.DATABASE_URL ? 'Conectada' : 'No configurada'}`);
});