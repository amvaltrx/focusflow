// Simplified LocalDbService using localStorage for maximum Android compatibility
// This avoids all background worker and MessagePort issues.

const storage = {
    getItem: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage Read Error', e);
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage Write Error', e);
        }
    }
};

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

class LocalDbService {
    async initDefaults() {
        if (!storage.getItem('ff_user')) {
            storage.setItem('ff_user', { 
                _id: 'local_user', 
                username: 'FocusUser', 
                points: 0, 
                totalXp: 0,
                companionLevel: 1,
                companionHealth: 100,
                companionExp: 0
            });
        }
        if (!storage.getItem('ff_tasks')) storage.setItem('ff_tasks', []);
        if (!storage.getItem('ff_goals')) storage.setItem('ff_goals', []);
        if (!storage.getItem('ff_logs')) storage.setItem('ff_logs', []);
    }

    // --- USER / AUTH ---
    async getUser() {
        return storage.getItem('ff_user');
    }

    async updateUser(updates) {
        const user = await this.getUser() || { 
            _id: 'local_user', 
            username: 'FocusUser', 
            points: 0, 
            totalXp: 0,
            companionLevel: 1,
            companionHealth: 100,
            companionExp: 0 
        };
        const updated = { ...user, ...updates };
        storage.setItem('ff_user', updated);
        return updated;
    }

    async awardPointsAndXp(priority) {
        let pointsToAdd = priority === 'high' ? 30 : priority === 'medium' ? 20 : 10;
        let expToAdd = priority === 'high' ? 100 : 50;

        const user = await this.getUser();
        let { points, totalXp, companionExp, companionLevel, companionHealth } = user;
        
        points = (points || 0) + pointsToAdd;
        totalXp = (totalXp || 0) + pointsToAdd;
        companionExp = (companionExp || 0) + expToAdd;

        const requiredExp = (companionLevel || 1) * 500;
        if (companionExp >= requiredExp) {
            companionExp -= requiredExp;
            companionLevel = (companionLevel || 1) + 1;
            companionHealth = 100;
        }

        await this.updateUser({ points, totalXp, companionExp, companionLevel, companionHealth });
    }

    // --- TASKS ---
    async getTasks() {
        return storage.getItem('ff_tasks') || [];
    }

    async createTask(data) {
        const tasks = await this.getTasks();
        const newTask = {
            _id: generateId(),
            ...data,
            status: 'pending',
            createdDate: new Date().toISOString(),
            actualTimeSpent: 0
        };
        tasks.push(newTask);
        storage.setItem('ff_tasks', tasks);
        return newTask;
    }

    async updateTask(id, data) {
        const tasks = await this.getTasks();
        const index = tasks.findIndex(t => t._id === id);
        if (index === -1) throw new Error('Task not found');
        tasks[index] = { ...tasks[index], ...data };
        storage.setItem('ff_tasks', tasks);
        return tasks[index];
    }

    async completeTask(id) {
        const tasks = await this.getTasks();
        const index = tasks.findIndex(t => t._id === id);
        if (index === -1) throw new Error('Task not found');
        
        const task = tasks[index];
        task.status = 'completed';
        task.completedDate = new Date().toISOString();
        
        await this.awardPointsAndXp(task.priority);

        if (task.isDaily) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            tasks.push({
                ...task,
                _id: generateId(),
                status: 'pending',
                createdDate: tomorrow.toISOString(),
                completedDate: null,
                actualTimeSpent: 0,
                deadline: task.deadline ? new Date(new Date(task.deadline).getTime() + 86400000).toISOString() : null
            });
        }

        storage.setItem('ff_tasks', tasks);
        return task;
    }

    async deleteTask(id) {
        let tasks = await this.getTasks();
        tasks = tasks.filter(t => t._id !== id);
        storage.setItem('ff_tasks', tasks);
        return { message: 'Task removed' };
    }

    async getSmartSchedule(clientHour) {
        const tasks = await this.getTasks();
        const pending = tasks.filter(t => t.status === 'pending');
        pending.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return 0;
        });

        const hour = parseInt(clientHour) || new Date().getHours();
        let currentHour = hour;
        
        const scheduled = pending.map(task => {
            const timeSlot = `${String(currentHour).padStart(2, '0')}:00 - ${String(currentHour + 1).padStart(2, '0')}:00`;
            currentHour++;
            if (currentHour > 23) currentHour = 8;
            return {
                task,
                timeSlot,
                reason: `Optimized for ${task.priority} priority`
            };
        });

        return { scheduledTasks: scheduled };
    }

    async redeemDayOff() {
        const user = await this.getUser();
        if (user.points < 500) throw new Error('Not enough points');
        
        await this.updateUser({ points: user.points - 500 });
        
        const tasks = await this.getTasks();
        const todayStr = new Date().toDateString();
        
        tasks.forEach(task => {
            if (task.status === 'pending' && new Date(task.createdDate).toDateString() === todayStr) {
                if (task.isDaily) {
                    task.status = 'completed';
                    task.completedDate = new Date().toISOString();
                    
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tasks.push({
                        ...task,
                        _id: generateId(),
                        status: 'pending',
                        createdDate: tomorrow.toISOString(),
                        completedDate: null,
                        actualTimeSpent: 0
                    });
                } else {
                    const nextDate = new Date(task.createdDate);
                    nextDate.setDate(nextDate.getDate() + 1);
                    task.createdDate = nextDate.toISOString();
                }
            }
        });
        storage.setItem('ff_tasks', tasks);
        return { message: 'Day off redeemed' };
    }

    // --- GOALS ---
    async getGoals() {
        return storage.getItem('ff_goals') || [];
    }

    async createGoal(data) {
        const goals = await this.getGoals();
        const newGoal = { _id: generateId(), ...data, createdDate: new Date().toISOString() };
        goals.push(newGoal);
        storage.setItem('ff_goals', goals);
        return newGoal;
    }

    async updateGoal(id, data) {
        const goals = await this.getGoals();
        const index = goals.findIndex(g => g._id === id);
        if (index > -1) {
            goals[index] = { ...goals[index], ...data };
            storage.setItem('ff_goals', goals);
            return goals[index];
        }
        throw new Error('Goal not found');
    }

    async deleteGoal(id) {
        let goals = await this.getGoals();
        goals = goals.filter(g => g._id !== id);
        storage.setItem('ff_goals', goals);
        return { message: 'Goal removed' };
    }

    // --- LOGS ---
    async createLog(data) {
        const logs = storage.getItem('ff_logs') || [];
        logs.push({ _id: generateId(), ...data, date: new Date().toISOString() });
        storage.setItem('ff_logs', logs);
        return { message: 'Logged' };
    }

    // --- STATS ---
    async getDashboardStats() {
        const tasks = await this.getTasks();
        const completedToday = tasks.filter(t => t.status === 'completed' && new Date(t.completedDate).toDateString() === new Date().toDateString());
        const activeTasks = tasks.filter(t => t.status === 'pending');
        const focusMins = completedToday.reduce((acc, t) => acc + (t.actualTimeSpent || 0), 0);
        
        return {
            streak: 1,
            completedTodayCount: completedToday.length,
            activeTasksCount: activeTasks.length,
            totalFocusMinutesToday: focusMins,
            dailyPercentage: (activeTasks.length + completedToday.length) === 0 ? 100 : Math.round((completedToday.length / (completedToday.length + activeTasks.length)) * 100),
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            weeklyTimeData: [0, 0, 0, 0, 0, 0, focusMins]
        };
    }

    async getMonthlyStats() {
        return [
            { month: 'Jan', completedTasks: 0, missedTasks: 0, focusHours: 0 }
        ];
    }
}

export default new LocalDbService();
