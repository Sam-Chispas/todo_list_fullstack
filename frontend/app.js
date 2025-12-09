class TodoApp {
    constructor() {
        // DETECCIÓN AUTOMÁTICA DE ENTORNO
        const isNetlify = window.location.hostname.includes('netlify.app');
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
        
        console.log('📍 Detección de entorno:');
        console.log('  Hostname:', window.location.hostname);
        console.log('  Netlify?:', isNetlify);
        console.log('  Local?:', isLocal);
        
        if (isNetlify) {
            // En Netlify, usar proxy (configurado en netlify.toml)
            this.BACKEND_URL = '';  // Mismo dominio
            this.API_URL = '/api/todos';
            this.HEALTH_URL = '/api/health';
            console.log('🌐 Modo: Netlify Production (usando proxy)');
        } else if (isLocal) {
            // Desarrollo local
            this.BACKEND_URL = 'http://localhost:10000';
            this.API_URL = 'http://localhost:10000/api/todos';
            this.HEALTH_URL = 'http://localhost:10000/api/health';
            console.log('💻 Modo: Desarrollo Local');
        } else {
            // Otros casos (acceso directo a Render, etc.)
            this.BACKEND_URL = 'https://todo-list-fullstack-1l3f.onrender.com';
            this.API_URL = 'https://todo-list-fullstack-1l3f.onrender.com/api/todos';
            this.HEALTH_URL = 'https://todo-list-fullstack-1l3f.onrender.com/api/health';
            console.log('🔗 Modo: Conexión Directa a Render');
        }
        
        console.log('🔗 URL API:', this.API_URL);
        console.log('🏥 URL Health:', this.HEALTH_URL);
        
        this.currentFilter = 'all';
        this.editingTodoId = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadTodos();
        this.checkBackendConnection();
    }
    
    initializeElements() {
        this.newTodoInput = document.getElementById('new-todo');
        this.addButton = document.getElementById('add-btn');
        this.todoList = document.getElementById('todo-list');
        this.todoCount = document.getElementById('todo-count');
        this.clearCompletedButton = document.getElementById('clear-completed');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.emptyState = document.getElementById('empty-state');
        this.editModal = document.getElementById('edit-modal');
        this.editTodoInput = document.getElementById('edit-todo-input');
        this.cancelEditButton = document.getElementById('cancel-edit');
        this.saveEditButton = document.getElementById('save-edit');
        this.backendStatus = document.getElementById('backend-status');
        this.backendWarning = document.getElementById('backend-warning');
    }
    
    setupEventListeners() {
        this.addButton.addEventListener('click', () => this.addTodo());
        this.newTodoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        this.clearCompletedButton.addEventListener('click', () => this.clearCompleted());
        
        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });
        
        this.cancelEditButton.addEventListener('click', () => this.closeEditModal());
        this.saveEditButton.addEventListener('click', () => this.saveEdit());
        
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editModal.style.display === 'flex') {
                this.closeEditModal();
            }
        });
    }
    
    async checkBackendConnection() {
        console.log('🔍 Verificando conexión al backend...');
        
        try {
            const response = await fetch(this.HEALTH_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend conectado:', data);
                
                this.updateBackendStatus('connected', '✅ Conectado');
                this.hideWarning();
                return true;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ No se pudo conectar al backend:', error.message);
            
            // Si estamos en Netlify y el proxy falla, intentar directo
            if (window.location.hostname.includes('netlify.app')) {
                console.log('🔄 Proxy falló, intentando conexión directa...');
                try {
                    const directResponse = await fetch('https://todo-list-fullstack-1l3f.onrender.com/api/health');
                    if (directResponse.ok) {
                        this.updateBackendStatus('warning', '⚠️ Conexión directa (CORS puede fallar)');
                        // Cambiar a conexión directa
                        this.API_URL = 'https://todo-list-fullstack-1l3f.onrender.com/api/todos';
                        this.HEALTH_URL = 'https://todo-list-fullstack-1l3f.onrender.com/api/health';
                        return true;
                    }
                } catch (directError) {
                    console.warn('Conexión directa también falló:', directError.message);
                }
            }
            
            this.updateBackendStatus('disconnected', '🔴 Modo offline');
            this.showWarning();
            return false;
        }
    }
    
    updateBackendStatus(status, text) {
        this.backendStatus.innerHTML = `<i class="fas fa-circle"></i> ${text}`;
        
        if (status === 'connected') {
            this.backendStatus.className = 'status-online';
        } else if (status === 'warning') {
            this.backendStatus.className = 'status-warning';
        } else {
            this.backendStatus.className = 'status-offline';
        }
    }
    
    showWarning() {
        if (this.backendWarning) {
            this.backendWarning.style.display = 'flex';
        }
    }
    
    hideWarning() {
        if (this.backendWarning) {
            this.backendWarning.style.display = 'none';
        }
    }
    
    async loadTodos() {
        console.log('📥 Cargando tareas desde:', this.API_URL);
        
        try {
            const response = await fetch(this.API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const todos = await response.json();
                console.log(`✅ ${todos.length} tareas cargadas del backend`);
                this.renderTodos(todos);
                this.updateStats(todos);
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar tareas del backend:', error.message);
            
            // Cargar desde localStorage
            const localTodos = this.getLocalTodos();
            console.log(`📱 ${localTodos.length} tareas cargadas de localStorage`);
            this.renderTodos(localTodos);
            this.updateStats(localTodos);
        }
    }
    
    async addTodo() {
        const text = this.newTodoInput.value.trim();
        if (!text) return;
        
        const todo = {
            text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        console.log('➕ Agregando tarea:', text);
        
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(todo)
            });
            
            if (response.ok) {
                const newTodo = await response.json();
                console.log('✅ Tarea guardada en backend:', newTodo);
                this.appendTodo(newTodo);
                this.newTodoInput.value = '';
                this.updateStatsAfterChange();
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.warn('⚠️ No se pudo guardar en backend, guardando localmente:', error.message);
            
            // Guardar localmente
            todo.id = Date.now().toString();
            this.saveTodoLocal(todo);
            this.appendTodo(todo);
            this.newTodoInput.value = '';
            this.updateStatsAfterChange();
        }
    }
    
    async toggleTodo(id, completed) {
        console.log(`🔄 Marcando tarea ${id} como ${completed ? 'completada' : 'pendiente'}`);
        
        try {
            const response = await fetch(`${this.API_URL}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed })
            });
            
            if (response.ok) {
                console.log('✅ Tarea actualizada en backend');
                this.updateStatsAfterChange();
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.warn('⚠️ No se pudo actualizar en backend, actualizando localmente:', error.message);
            this.toggleTodoLocal(id, completed);
            this.updateStatsAfterChange();
        }
    }
    
    async deleteTodo(id) {
        console.log(`🗑️ Eliminando tarea ${id}`);
        
        if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log('✅ Tarea eliminada del backend');
                this.removeTodoElement(id);
                this.updateStatsAfterChange();
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.warn('⚠️ No se pudo eliminar del backend, eliminando localmente:', error.message);
            this.deleteTodoLocal(id);
            this.removeTodoElement(id);
            this.updateStatsAfterChange();
        }
    }
    
    async updateTodo(id, text) {
        console.log(`✏️ Editando tarea ${id}:`, text);
        
        try {
            const response = await fetch(`${this.API_URL}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });
            
            if (response.ok) {
                console.log('✅ Tarea editada en backend');
                this.updateTodoElement(id, text);
                this.updateStatsAfterChange();
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.warn('⚠️ No se pudo editar en backend, editando localmente:', error.message);
            this.updateTodoLocal(id, text);
            this.updateTodoElement(id, text);
            this.updateStatsAfterChange();
        }
    }
    
    async clearCompleted() {
        console.log('🧹 Limpiando tareas completadas');
        
        if (!confirm('¿Estás seguro de que quieres eliminar todas las tareas completadas?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.API_URL}/clear-completed`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const remainingTodos = await response.json();
                console.log(`✅ Tareas completadas eliminadas del backend`);
                this.renderTodos(remainingTodos);
                this.updateStats(remainingTodos);
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.warn('⚠️ No se pudo limpiar en backend, limpiando localmente:', error.message);
            this.clearCompletedLocal();
            const localTodos = this.getLocalTodos();
            this.renderTodos(localTodos);
            this.updateStats(localTodos);
        }
    }
    
    openEditModal(todo) {
        this.editingTodoId = todo.id;
        this.editTodoInput.value = todo.text;
        this.editModal.style.display = 'flex';
        this.editTodoInput.focus();
        this.editTodoInput.select();
    }
    
    closeEditModal() {
        this.editModal.style.display = 'none';
        this.editingTodoId = null;
        this.editTodoInput.value = '';
    }
    
    async saveEdit() {
        const text = this.editTodoInput.value.trim();
        if (!text || !this.editingTodoId) {
            this.closeEditModal();
            return;
        }
        
        await this.updateTodo(this.editingTodoId, text);
        this.closeEditModal();
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        this.filterButtons.forEach(button => {
            if (button.dataset.filter === filter) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        this.loadTodos();
    }
    
    renderTodos(todos) {
        // Filtrar según el filtro actual
        let filteredTodos = todos;
        if (this.currentFilter === 'active') {
            filteredTodos = todos.filter(todo => !todo.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTodos = todos.filter(todo => todo.completed);
        }
        
        // Mostrar/ocultar estado vacío
        if (filteredTodos.length === 0) {
            this.emptyState.style.display = 'block';
            this.todoList.innerHTML = '';
        } else {
            this.emptyState.style.display = 'none';
            this.todoList.innerHTML = '';
            
            filteredTodos.forEach(todo => {
                this.todoList.appendChild(this.createTodoElement(todo));
            });
        }
    }
    
    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;
        
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${this.escapeHtml(todo.text)}</span>
            <div class="todo-actions">
                <button class="btn-edit" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" title="Eliminar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        const checkbox = li.querySelector('.todo-checkbox');
        const editButton = li.querySelector('.btn-edit');
        const deleteButton = li.querySelector('.btn-delete');
        const todoText = li.querySelector('.todo-text');
        
        checkbox.addEventListener('change', () => {
            this.toggleTodo(todo.id, checkbox.checked);
            li.classList.toggle('completed', checkbox.checked);
            this.updateStatsAfterChange();
        });
        
        editButton.addEventListener('click', () => {
            this.openEditModal(todo);
        });
        
        deleteButton.addEventListener('click', () => {
            this.deleteTodo(todo.id);
        });
        
        todoText.addEventListener('dblclick', () => {
            this.openEditModal(todo);
        });
        
        return li;
    }
    
    appendTodo(todo) {
        if (this.emptyState.style.display === 'block') {
            this.emptyState.style.display = 'none';
        }
        
        let shouldShow = true;
        if (this.currentFilter === 'active' && todo.completed) {
            shouldShow = false;
        } else if (this.currentFilter === 'completed' && !todo.completed) {
            shouldShow = false;
        }
        
        if (shouldShow) {
            const todoElement = this.createTodoElement(todo);
            this.todoList.appendChild(todoElement);
        }
        
        this.updateStatsAfterChange();
    }
    
    removeTodoElement(id) {
        const todoElement = document.querySelector(`.todo-item[data-id="${id}"]`);
        if (todoElement) {
            todoElement.remove();
        }
    }
    
    updateTodoElement(id, text) {
        const todoElement = document.querySelector(`.todo-item[data-id="${id}"] .todo-text`);
        if (todoElement) {
            todoElement.textContent = text;
        }
    }
    
    async updateStatsAfterChange() {
        try {
            const response = await fetch(this.API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const todos = await response.json();
                this.updateStats(todos);
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            const localTodos = this.getLocalTodos();
            this.updateStats(localTodos);
        }
    }
    
    updateStats(todos) {
        const activeCount = todos.filter(todo => !todo.completed).length;
        const totalCount = todos.length;
        const completedCount = totalCount - activeCount;
        
        this.todoCount.textContent = `${activeCount} tarea${activeCount !== 1 ? 's' : ''} pendiente${activeCount !== 1 ? 's' : ''}`;
        this.clearCompletedButton.style.display = completedCount > 0 ? 'flex' : 'none';
    }
    
    // Métodos para localStorage
    getLocalTodos() {
        try {
            const todos = localStorage.getItem('todo_app_tasks');
            return todos ? JSON.parse(todos) : [];
        } catch (error) {
            console.error('Error leyendo localStorage:', error);
            return [];
        }
    }
    
    saveTodoLocal(todo) {
        try {
            const todos = this.getLocalTodos();
            todos.push(todo);
            localStorage.setItem('todo_app_tasks', JSON.stringify(todos));
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    }
    
    toggleTodoLocal(id, completed) {
        try {
            const todos = this.getLocalTodos();
            const todoIndex = todos.findIndex(todo => todo.id == id);
            if (todoIndex !== -1) {
                todos[todoIndex].completed = completed;
                localStorage.setItem('todo_app_tasks', JSON.stringify(todos));
            }
        } catch (error) {
            console.error('Error actualizando en localStorage:', error);
        }
    }
    
    deleteTodoLocal(id) {
        try {
            let todos = this.getLocalTodos();
            todos = todos.filter(todo => todo.id != id);
            localStorage.setItem('todo_app_tasks', JSON.stringify(todos));
        } catch (error) {
            console.error('Error eliminando de localStorage:', error);
        }
    }
    
    updateTodoLocal(id, text) {
        try {
            const todos = this.getLocalTodos();
            const todoIndex = todos.findIndex(todo => todo.id == id);
            if (todoIndex !== -1) {
                todos[todoIndex].text = text;
                localStorage.setItem('todo_app_tasks', JSON.stringify(todos));
            }
        } catch (error) {
            console.error('Error editando en localStorage:', error);
        }
    }
    
    clearCompletedLocal() {
        try {
            let todos = this.getLocalTodos();
            todos = todos.filter(todo => !todo.completed);
            localStorage.setItem('todo_app_tasks', JSON.stringify(todos));
        } catch (error) {
            console.error('Error limpiando localStorage:', error);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando To-Do App...');
    new TodoApp();
});