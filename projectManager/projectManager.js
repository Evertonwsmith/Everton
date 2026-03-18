/**
 * Professional Project Manager - Modern ES6+ Implementation
 * Features: Task management, localStorage persistence, sorting, responsive design
 */

class ProjectManager {
    constructor() {
        this.tasks = [];
        this.taskIdCounter = 1;
        
        // DOM Elements
        this.taskForm = document.getElementById('taskForm');
        this.taskNameInput = document.getElementById('taskName');
        this.prioritySelect = document.getElementById('priority');
        this.dueDateInput = document.getElementById('dueDate');
        this.estimatedTimeInput = document.getElementById('estimatedTime');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasksEl = document.getElementById('totalTasks');
        this.activeTasksEl = document.getElementById('activeTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.render();
        this.updateStats();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });
        
        // Set default due date to today
        const today = new Date().toISOString().split('T')[0];
        this.dueDateInput.min = today;
        this.dueDateInput.value = today;
    }
    
    /**
     * Generate unique task ID
     */
    generateId() {
        return Date.now() + '-' + this.taskIdCounter++;
    }
    
    /**
     * Add a new task
     */
    addTask() {
        const taskName = this.taskNameInput.value.trim();
        const priority = parseInt(this.prioritySelect.value);
        const dueDate = this.dueDateInput.value;
        const estimatedTime = parseFloat(this.estimatedTimeInput.value);
        
        // Validation
        if (!taskName) {
            this.showNotification('Please enter a task name', 'error');
            this.taskNameInput.focus();
            return;
        }
        
        if (!dueDate) {
            this.showNotification('Please select a due date', 'error');
            this.dueDateInput.focus();
            return;
        }
        
        if (!estimatedTime || estimatedTime <= 0) {
            this.showNotification('Please enter a valid estimated time', 'error');
            this.estimatedTimeInput.focus();
            return;
        }
        
        // Create task object
        const newTask = {
            id: this.generateId(),
            name: taskName,
            priority,
            dueDate,
            estimatedTime,
            completed: false,
            progression: 0, // Progress in days (0 to estimatedTime)
            createdAt: new Date().toISOString()
        };
        
        // Add to tasks array
        this.tasks.unshift(newTask);
        
        // Clear form
        this.taskForm.reset();
        this.dueDateInput.value = new Date().toISOString().split('T')[0];
        
        // Save and render
        this.saveTasks();
        this.render();
        this.updateStats();
        
        // Show success notification
        this.showNotification('Task added successfully!', 'success');
    }
    
    /**
     * Toggle task completion status
     */
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
            this.updateStats();
            
            const message = task.completed ? 'Task completed!' : 'Task marked as active';
            this.showNotification(message, 'success');
        }
    }

    /**
     * Update task progression
     */
    updateProgression(id, progression) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            // Ensure progression is within bounds
            const maxProgression = task.estimatedTime;
            const clampedProgression = Math.max(0, Math.min(progression, maxProgression));
            
            task.progression = parseFloat(clampedProgression.toFixed(2));
            
            // Auto-complete if progression equals estimated time
            if (task.progression >= task.estimatedTime) {
                task.completed = true;
            }
            
            this.saveTasks();
            this.render();
            this.updateStats();
            
            const percentage = ((task.progression / task.estimatedTime) * 100).toFixed(1);
            this.showNotification(`Progress updated: ${percentage}% complete`, 'success');
        }
    }

    /**
     * Increment task progression by 0.25 days
     */
    incrementProgression(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.updateProgression(id, task.progression + 0.25);
        }
    }

    /**
     * Decrement task progression by 0.25 days
     */
    decrementProgression(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.updateProgression(id, task.progression - 0.25);
        }
    }
    
    /**
     * Delete a task
     */
    deleteTask(id) {
        const taskIndex = this.tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            const taskName = this.tasks[taskIndex].name;
            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
            this.render();
            this.updateStats();
            this.showNotification(`Task "${taskName}" deleted`, 'warning');
        }
    }
    
    /**
     * Sort tasks by priority (desc) and due date (asc)
     */
    sortTasks() {
        this.tasks.sort((a, b) => {
            // First sort by priority (descending - highest first)
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            // Then sort by due date (ascending - earliest first)
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }
    
    /**
     * Save tasks to localStorage
     */
    saveTasks() {
        try {
            localStorage.setItem('projectManager_tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks:', error);
            this.showNotification('Failed to save tasks', 'error');
        }
    }
    
    /**
     * Load tasks from localStorage
     */
    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('projectManager_tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                // Ensure we have a counter for new IDs
                if (this.tasks.length > 0) {
                    const maxId = Math.max(...this.tasks.map(t => 
                        parseInt(t.id.split('-')[1] || 0)
                    ));
                    this.taskIdCounter = maxId + 1;
                }
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.tasks = [];
        }
    }
    
    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    /**
     * Get priority label
     */
    getPriorityLabel(priority) {
        const labels = {
            5: 'Highest',
            4: 'High', 
            3: 'Medium',
            2: 'Low',
            1: 'Lowest'
        };
        return labels[priority] || 'Unknown';
    }
    
    /**
     * Get priority class for styling
     */
    getPriorityClass(priority) {
        return `priority-${priority}`;
    }
    
    /**
     * Check if task is overdue
     */
    isOverdue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        // Set time to end of day for comparison
        due.setHours(23, 59, 59, 999);
        return due < today && !this.tasks.find(t => t.dueDate === dueDate)?.completed;
    }
    
    /**
     * Create task DOM element
     */
    createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskEl.setAttribute('data-id', task.id);
        
        const isOverdue = this.isOverdue(task.dueDate);
        const progressPercentage = task.estimatedTime > 0 ? 
            ((task.progression / task.estimatedTime) * 100).toFixed(1) : 0;
        
        taskEl.innerHTML = `
            <div class="task-info">
                <div class="task-name">${this.escapeHtml(task.name)}</div>
                <div class="task-meta">
                    <span class="priority-badge ${this.getPriorityClass(task.priority)}">
                        ${this.getPriorityLabel(task.priority)}
                    </span>
                    <span>Due: ${this.formatDate(task.dueDate)} ${isOverdue ? '<span style="color: var(--danger); font-weight: bold;">(Overdue)</span>' : ''}</span>
                    <span>Time: ${task.estimatedTime} days</span>
                </div>
                <div class="progress-section">
                    <div class="progress-info">
                        <span class="progress-text">Progress: ${task.progression.toFixed(2)} / ${task.estimatedTime} days (${progressPercentage}%)</span>
                    </div>
                    <div class="progress-controls">
                        <button class="btn btn-secondary progress-btn" onclick="projectManager.decrementProgression('${task.id}')">-0.25</button>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <button class="btn btn-secondary progress-btn" onclick="projectManager.incrementProgression('${task.id}')">+0.25</button>
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn ${task.completed ? 'btn-warning' : 'btn-primary'} action-btn" 
                        onclick="projectManager.toggleTask('${task.id}')">
                    ${task.completed ? 'Mark Active' : 'Complete'}
                </button>
                <button class="btn btn-danger action-btn" 
                        onclick="projectManager.deleteTask('${task.id}')">
                    Delete
                </button>
            </div>
        `;
        
        return taskEl;
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Render the task list
     */
    render() {
        // Sort tasks
        this.sortTasks();
        
        // Clear current list
        this.taskList.innerHTML = '';
        
        // Show/hide empty state
        if (this.tasks.length === 0) {
            this.emptyState.style.display = 'block';
            this.taskList.style.display = 'none';
        } else {
            this.emptyState.style.display = 'none';
            this.taskList.style.display = 'block';
            
            // Render each task
            this.tasks.forEach(task => {
                const taskEl = this.createTaskElement(task);
                this.taskList.appendChild(taskEl);
            });
        }
    }
    
    /**
     * Update task statistics
     */
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        
        this.totalTasksEl.textContent = total;
        this.activeTasksEl.textContent = active;
        this.completedTasksEl.textContent = completed;
    }
    
    /**
     * Show notification toast
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'error' ? 'var(--danger)' : 
                       type === 'success' ? 'var(--success)' : 
                       type === 'warning' ? 'var(--warning)' : 'var(--primary-color)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: '1000',
            transform: 'translateX(120%)',
            transition: 'transform 0.3s ease-out',
            fontSize: '14px',
            fontWeight: '600'
        });
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.projectManager = new ProjectManager();
});

// Export for testing (if needed in module environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectManager;
}