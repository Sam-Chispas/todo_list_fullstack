create database todolist;
use todolist;
-- Crear tabla de tareas
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de ejemplo
INSERT INTO todos (text, completed) VALUES
    ('Aprender JavaScript', true),
    ('Crear una aplicación Full Stack', false),
    ('Desplegar en la nube', false),
    ('Comprar víveres', false),
    ('Hacer ejercicio', true);

-- Crear índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);