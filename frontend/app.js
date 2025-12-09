class TodoApp {
    constructor() {
        // URL del backend en Render (la obtendrás después)
        this.apiUrl = 'https://todo-list-fullstack-1l3f.onrender.com';
        
        // Fallback para desarrollo local
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.apiUrl = 'http://localhost:3000/api/todos';
        }
        
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
        
        // Cerrar modal al hacer clic fuera de él
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });
        
        // Cerrar modal con la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editModal.style.display === 'flex') {
                this.closeEditModal();
            }
        });
    }
    
    async checkBackendConnection() {
        try {
            const response = await fetch(this.apiUrl.replace('/api/todos', '/health'));
            if (response.ok) {
                const data = await response.json();
                this.backendStatus.innerHTML = `<i class="fas fa-circle"></i> ${data.status || 'Conectado'}`;
                this.backendStatus.className = 'status-online';
            } else {
                throw new Error('Backend no disponible');
            }
        } catch (error) {
            console.warn('No se pudo conectar al backend:', error);
            this.backendStatus.innerHTML = '<i class="fas fa-circle"></i> Desconectado';
            this.backendStatus.className = 'status-offline';
            
            // Mostrar alerta amigable
            if (!localStorage.getItem('backendWarningShown')) {
                alert('⚠️ El backend está temporalmente fuera de línea. Las tareas se guardarán localmente hasta que se restablezca la conexión.');
                localStorage.setItem('backendWarningShown', 'true');
            }
        }
    }
    async loadTodos() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Error al cargar tareas');
            
            const todos = await response.json();
            this.renderTodos(todos);
            this.updateStats(todos);
        } catch (error) {
            console.error('Error al cargar tareas:', error);
            // Cargar datos locales si el backend no está disponible
            const localTodos = this.getLocalTodos();
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
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(todo)
            });
            
            if (!response.ok) throw new Error('Error al agregar tarea');
            
            const newTodo = await response.json();
            this.appendTodo(newTodo);
            this.newTodoInput.value = '';
            this.updateStatsAfterChange();
            
        } catch (error) {
            console.error('Error al agregar tarea:', error);
            // Guardar localmente si el backend falla
            todo.id = Date.now().toString();
            this.saveTodoLocal(todo);
            this.appendTodo(todo);
            this.newTodoInput.value = '';
            this.updateStatsAfterChange();
        }
    }
    
    async toggleTodo(id, completed) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed })
            });
            
            if (!response.ok) throw new Error('Error al actualizar tarea');
            
            this.updateStatsAfterChange();
            
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            // Actualizar localmente si el backend falla
            this.toggleTodoLocal(id, completed);
            this.updateStatsAfterChange();
        }
    }
    
    async deleteTodo(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al eliminar tarea');
            
            this.removeTodoElement(id);
            this.updateStatsAfterChange();
            
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            // Eliminar localmente si el backend falla
            this.deleteTodoLocal(id);
            this.removeTodoElement(id);
            this.updateStatsAfterChange();
        }
    }
    
    async updateTodo(id, text) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) throw new Error('Error al actualizar tarea');
            
            this.updateTodoElement(id, text);
            this.updateStatsAfterChange();
            
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            // Actualizar localmente si el backend falla
            this.updateTodoLocal(id, text);
            this.updateTodoElement(id, text);
            this.updateStatsAfterChange();
        }
    }
    
    async clearCompleted() {
        try {
            const response = await fetch(`${this.apiUrl}/clear-completed`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al limpiar tareas completadas');
            
            const remainingTodos = await response.json();
            this.renderTodos(remainingTodos);
            this.updateStats(remainingTodos);
            
        } catch (error) {
            console.error('Error al limpiar tareas completadas:', error);
            // Limpiar localmente si el backend falla
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
        
        // Event listeners para los elementos dentro del li
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
            if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                this.deleteTodo(todo.id);
            }
        });
        
        // Doble clic para editar
        todoText.addEventListener('dblclick', () => {
            this.openEditModal(todo);
        });
        
        return li;
    }
    
    appendTodo(todo) {
        if (this.emptyState.style.display === 'block') {
            this.emptyState.style.display = 'none';
        }
        
        // Verificar si la tarea debe mostrarse con el filtro actual
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
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Error al cargar estadísticas');
            
            const todos = await response.json();
            this.updateStats(todos);
            
        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
            const localTodos = this.getLocalTodos();
            this.updateStats(localTodos);
        }
    }
    
    updateStats(todos) {
        const activeCount = todos.filter(todo => !todo.completed).length;
        const totalCount = todos.length;
        
        this.todoCount.textContent = `${activeCount} tarea${activeCount !== 1 ? 's' : ''} pendiente${activeCount !== 1 ? 's' : ''}`;
        
        // Mostrar/ocultar botón de limpiar completadas
        const completedCount = todos.filter(todo => todo.completed).length;
        this.clearCompletedButton.style.display = completedCount > 0 ? 'flex' : 'none';
    }
    
    // Métodos para almacenamiento local (fallback)
    getLocalTodos() {
        const todos = localStorage.getItem('todos');
        return todos ? JSON.parse(todos) : [];
    }
    
    saveTodoLocal(todo) {
        const todos = this.getLocalTodos();
        todos.push(todo);
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    toggleTodoLocal(id, completed) {
        const todos = this.getLocalTodos();
        const todoIndex = todos.findIndex(todo => todo.id === id);
        if (todoIndex !== -1) {
            todos[todoIndex].completed = completed;
            localStorage.setItem('todos', JSON.stringify(todos));
        }
    }
    
    deleteTodoLocal(id) {
        let todos = this.getLocalTodos();
        todos = todos.filter(todo => todo.id !== id);
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    updateTodoLocal(id, text) {
        const todos = this.getLocalTodos();
        const todoIndex = todos.findIndex(todo => todo.id === id);
        if (todoIndex !== -1) {
            todos[todoIndex].text = text;
            localStorage.setItem('todos', JSON.stringify(todos));
        }
    }
    
    clearCompletedLocal() {
        let todos = this.getLocalTodos();
        todos = todos.filter(todo => !todo.completed);
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});