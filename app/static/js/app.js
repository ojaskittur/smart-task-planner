class SmartTaskPlanner {
    constructor() {
        this.apiBase = '/api';
        this.goals = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadGoals();
    }

    bindEvents() {
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGoal();
        });

        document.getElementById('editGoalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateGoal();
        });

        document.getElementById('editTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTask();
        });
    }

    async createGoal() {
        const generateBtn = document.getElementById('generateBtn');
        const originalText = generateBtn.innerHTML;

        try {
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';
            generateBtn.disabled = true;

            const goalData = {
                title: document.getElementById('goalTitle').value,
                description: document.getElementById('goalDescription').value,
                deadline_days: parseInt(document.getElementById('deadlineDays').value)
            };

            const response = await fetch(`${this.apiBase}/goals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(goalData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create goal');
            }


            // Reset form
            document.getElementById('goalForm').reset();
            document.getElementById('deadlineDays').value = 14;

            // Reload goals
            await this.loadGoals();

            // Show success message
            this.showAlert('Goal created successfully! AI has generated your task breakdown.', 'success');

        } catch (error) {
            console.error('Error creating goal:', error);
            this.showAlert(`Error creating goal: ${error.message}`, 'danger');
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }

    async loadGoals() {
        try {
            const response = await fetch(`${this.apiBase}/goals`);
            this.goals = await response.json();
            this.renderGoals(this.goals);
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    }

    renderGoals(goals) {
        const goalsList = document.getElementById('goalsList');

        if (goals.length === 0) {
            goalsList.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i>
                    No goals yet. Create your first goal above!
                </div>
            `;
            return;
        }

        goalsList.innerHTML = goals.map(goal => `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${this.escapeHtml(goal.title)}</h5>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="app.openGoalEditModal(${goal.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deleteGoal(${goal.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <p class="text-muted">${this.escapeHtml(goal.description)}</p>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>
                                Timeline: ${goal.deadline_days} days
                            </small>
                        </div>
                        <div class="col-md-6 text-end">
                            <small class="text-muted">
                                Created: ${new Date(goal.created_at).toLocaleDateString()}
                            </small>
                        </div>
                    </div>

                    <h6 class="mb-3">Task Breakdown:</h6>
                    <div class="row">
                        <div class="col-md-8">
                            ${this.renderTasksList(goal.tasks)}
                        </div>
                        <div class="col-md-4">
                            ${this.renderTimeline(goal.tasks, goal.deadline_days)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderTasksList(tasks) {
        return tasks.map((task, index) => `
            <div class="card task-card mb-2 ${task.status === 'completed' ? 'completed' : ''} priority-${task.priority}"
                 style="cursor: pointer;">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${index + 1}. ${this.escapeHtml(task.title)}</h6>
                            <small class="text-muted">${this.escapeHtml(task.description)}</small>
                            <div class="mt-1">
                                <small class="badge bg-secondary me-1">
                                    <i class="fas fa-clock me-1"></i>${task.duration_days} day${task.duration_days !== 1 ? 's' : ''}
                                </small>
                                <small class="badge bg-warning me-1">${task.priority}</small>
                                ${task.dependencies.length > 0 ? `
                                    <small class="badge bg-info">
                                        <i class="fas fa-link me-1"></i>Depends on: ${task.dependencies.join(', ')}
                                    </small>
                                ` : ''}
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-secondary me-2" onclick="app.openTaskEditModal(${task.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm ${task.status === 'completed' ? 'btn-success' : 'btn-outline-success'}"
                                    onclick="event.stopPropagation(); app.toggleTaskStatus(${task.id}, '${task.status}')">
                                <i class="fas ${task.status === 'completed' ? 'fa-check' : 'fa-circle'}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderTimeline(tasks, deadlineDays) {
        return `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">Timeline Overview</h6>
                </div>
                <div class="card-body">
                    ${tasks.map((task, index) => `
                        <div class="mb-2">
                            <small class="d-block mb-1">${index + 1}. ${this.escapeHtml(task.title)}</small>
                            <div class="timeline-bar">
                                <div class="task-progress" style="width: ${(task.duration_days / deadlineDays) * 100}%;
                                    margin-left: ${(task.start_day / deadlineDays) * 100}%;"></div>
                            </div>
                            <small class="text-muted">
                                Day ${task.start_day + 1}-${task.end_day + 1}
                            </small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    openGoalEditModal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            document.getElementById('editGoalId').value = goal.id;
            document.getElementById('editGoalTitle').value = goal.title;
            document.getElementById('editGoalDescription').value = goal.description;
            document.getElementById('editDeadlineDays').value = goal.deadline_days;
            const modal = new bootstrap.Modal(document.getElementById('goalEditModal'));
            modal.show();
        }
    }

    async updateGoal() {
        const goalId = document.getElementById('editGoalId').value;
        const goalData = {
            title: document.getElementById('editGoalTitle').value,
            description: document.getElementById('editGoalDescription').value,
            deadline_days: parseInt(document.getElementById('editDeadlineDays').value)
        };

        try {
            const response = await fetch(`${this.apiBase}/goals/${goalId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalData)
            });

            if (response.ok) {
                await this.loadGoals();
                const modal = bootstrap.Modal.getInstance(document.getElementById('goalEditModal'));
                modal.hide();
                this.showAlert('Goal updated successfully', 'success');
            }
        } catch (error) {
            console.error('Error updating goal:', error);
            this.showAlert('Error updating goal', 'danger');
        }
    }

    openTaskEditModal(taskId) {
        let task;
        for (const goal of this.goals) {
            task = goal.tasks.find(t => t.id === taskId);
            if (task) break;
        }

        if (task) {
            document.getElementById('editTaskId').value = task.id;
            document.getElementById('editTaskTitle').value = task.title;
            document.getElementById('editTaskDescription').value = task.description;
            document.getElementById('editTaskDuration').value = task.duration_days;
            document.getElementById('editTaskPriority').value = task.priority;
            const modal = new bootstrap.Modal(document.getElementById('taskEditModal'));
            modal.show();
        }
    }

    async updateTask() {
        const taskId = document.getElementById('editTaskId').value;
        const taskData = {
            title: document.getElementById('editTaskTitle').value,
            description: document.getElementById('editTaskDescription').value,
            duration_days: parseInt(document.getElementById('editTaskDuration').value),
            priority: document.getElementById('editTaskPriority').value
        };

        try {
            const response = await fetch(`${this.apiBase}/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                await this.loadGoals();
                const modal = bootstrap.Modal.getInstance(document.getElementById('taskEditModal'));
                modal.hide();
                this.showAlert('Task updated successfully', 'success');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showAlert('Error updating task', 'danger');
        }
    }

    async toggleTaskStatus(taskId, currentStatus) {
        try {
            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

            const response = await fetch(`${this.apiBase}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                await this.loadGoals();
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showAlert('Error updating task status', 'danger');
        }
    }

    async deleteGoal(goalId) {
        if (!confirm('Are you sure you want to delete this goal and all its tasks?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/goals/${goalId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadGoals();
                this.showAlert('Goal deleted successfully', 'success');
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            this.showAlert('Error deleting goal', 'danger');
        }
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.querySelector('.container-fluid').insertBefore(alertDiv, document.querySelector('.row'));

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the application
const app = new SmartTaskPlanner();