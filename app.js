document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const taskDateTime = document.getElementById('taskDateTime');
    const addTaskBtn = document.getElementById('addTask');
    const taskList = document.getElementById('taskList');
    const tasksLeft = document.getElementById('tasksLeft');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const notification = document.getElementById('notification');
    const notificationMessage = notification.querySelector('.notification-message');
    const notificationIcon = notification.querySelector('.notification-icon');
    const overlay = document.getElementById('overlay');

    let tasks = [];
    let currentFilter = 'all';
    let notificationTimeout;

    // API endpoints
    const API_URL = 'http://localhost:3000/api';

    // Show notification
    const showNotification = (message, type = 'success') => {
        // Clear any existing timeout
        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
        }

        // Set notification content
        notificationMessage.textContent = message;
        notificationIcon.className = 'notification-icon';
        
        // Set icon based on type
        if (type === 'success') {
            notificationIcon.classList.add('fas', 'fa-check-circle');
            notification.classList.remove('error');
            notification.classList.add('success');
        } else if (type === 'error') {
            notificationIcon.classList.add('fas', 'fa-exclamation-circle');
            notification.classList.remove('success');
            notification.classList.add('error');
        }

        // Show overlay and notification
        overlay.classList.add('show');
        notification.classList.add('show');

        // Hide notification and overlay after 3 seconds
        notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
            overlay.classList.remove('show');
        }, 3000);
    };

    // Format date and time
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Load tasks from API
    const loadTasks = async () => {
        try {
            const response = await fetch(`${API_URL}/tasks`);
            tasks = await response.json();
            renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            showNotification('Failed to load tasks. Please try again.', 'error');
        }
    };

    // Create task element
    const createTaskElement = (task) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task._id;

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <span class="task-date">${formatDateTime(task.date)}</span>
            </div>
            <button class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;

        // Add event listeners
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTask(task._id));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task._id));

        return li;
    };

    // Render tasks based on current filter
    const renderTasks = () => {
        taskList.innerHTML = '';
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        // Sort tasks by date
        filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

        filteredTasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });

        updateTasksLeft();
    };

    // Add new task
    const addTask = async (text) => {
        if (text.trim() === '') return;

        const dateTime = taskDateTime.value ? new Date(taskDateTime.value) : new Date();

        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    text: text.trim(),
                    date: dateTime
                })
            });

            const newTask = await response.json();
            tasks.unshift(newTask);
            renderTasks();
            taskDateTime.value = ''; // Clear the datetime input
            
            // Show success notification
            showNotification(`Task "${text.trim()}" added successfully!`);
        } catch (error) {
            console.error('Error adding task:', error);
            showNotification('Failed to add task. Please try again.', 'error');
        }
    };

    // Toggle task completion
    const toggleTask = async (id) => {
        try {
            const task = tasks.find(t => t._id === id);
            const response = await fetch(`${API_URL}/tasks/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed: !task.completed })
            });

            const updatedTask = await response.json();
            tasks = tasks.map(t => t._id === id ? updatedTask : t);
            renderTasks();
            
            // Show success notification
            const status = updatedTask.completed ? 'completed' : 'uncompleted';
            showNotification(`Task marked as ${status}!`);
        } catch (error) {
            console.error('Error toggling task:', error);
            showNotification('Failed to update task. Please try again.', 'error');
        }
    };

    // Delete task
    const deleteTask = async (id) => {
        try {
            const taskToDelete = tasks.find(t => t._id === id);
            await fetch(`${API_URL}/tasks/${id}`, {
                method: 'DELETE'
            });
            tasks = tasks.filter(task => task._id !== id);
            renderTasks();
            
            // Show success notification
            showNotification(`Task "${taskToDelete.text}" deleted successfully!`);
        } catch (error) {
            console.error('Error deleting task:', error);
            showNotification('Failed to delete task. Please try again.', 'error');
        }
    };

    // Clear completed tasks
    const clearCompleted = async () => {
        try {
            const completedCount = tasks.filter(task => task.completed).length;
            await fetch(`${API_URL}/tasks/completed/all`, {
                method: 'DELETE'
            });
            tasks = tasks.filter(task => !task.completed);
            renderTasks();
            
            // Show success notification
            showNotification(`${completedCount} completed task(s) cleared!`);
        } catch (error) {
            console.error('Error clearing completed tasks:', error);
            showNotification('Failed to clear completed tasks. Please try again.', 'error');
        }
    };

    // Update tasks left counter
    const updateTasksLeft = () => {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksLeft.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
    };

    // Event Listeners
    addTaskBtn.addEventListener('click', () => {
        addTask(taskInput.value);
        taskInput.value = '';
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(taskInput.value);
            taskInput.value = '';
        }
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Initial load
    loadTasks();
}); 