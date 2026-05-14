import localforage from 'localforage';

const db = {
    tasks: localforage.createInstance({ name: 'FocusFlow', storeName: 'tasks' }),
    goals: localforage.createInstance({ name: 'FocusFlow', storeName: 'goals' }),
    user: localforage.createInstance({ name: 'FocusFlow', storeName: 'user' }),
    logs: localforage.createInstance({ name: 'FocusFlow', storeName: 'logs' })
};

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);

class LocalDbService {
    async initDefaults() {
        const user = await db.user.getItem('profile');
        if (!user) {
            await db.user.setItem('profile', { 
                _id: 'local_user', 
                username: 'FocusUser', 
                points: 0, 
                totalXp: 0,
                companionLevel: 1,
                companionHealth: 100,
                companionExp: 0
            });
        }
        
        const tasks = await db.tasks.getItem('list');
        if (!tasks) await db.tasks.setItem('list', []);

        const goals = await db.goals.getItem('list');
        if (!goals) await db.goals.setItem('list', []);
        
        const logs = await db.logs.getItem('list');
        if (!logs) await db.logs.setItem('list', []);
    }

    // --- USER / AUTH ---
    async getUser() {
        return await db.user.getItem('profile');
    }

    async updateUser(updates) {
        const user = await this.getUser();
        const updated = { ...user, ...updates };
        await db.user.setItem('profile', updated);
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
        return await db.tasks.getItem('list');
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
        await db.tasks.setItem('list', tasks);
        return newTask;
    }

    async updateTask(id, data) {
        const tasks = await this.getTasks();
        const index = tasks.findIndex(t => t._id === id);
        if (index === -1) throw new Error('Task not found');
        tasks[index] = { ...tasks[index], ...data };
        await db.tasks.setItem('list', tasks);
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

        await db.tasks.setItem('list', tasks);
        return task;
    }

    async deleteTask(id) {
        let tasks = await this.getTasks();
        tasks = tasks.filter(t => t._id !== id);
        await db.tasks.setItem('list', tasks);
        return { message: 'Task removed' };
    }

    async getSmartSchedule(clientHour) {
        const tasks = await this.getTasks();
        const pending = tasks.filter(t => t.status === 'pending');
        // Simple mock of smart scheduling
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
                    if (task.deadline) {
                        const newDeadline = new Date(task.deadline);
                        newDeadline.setDate(newDeadline.getDate() + 1);
                        task.deadline = newDeadline.toISOString();
                    }
                }
            }
        });
        await db.tasks.setItem('list', tasks);
        return { message: 'Day off redeemed' };
    }

    // --- GOALS ---
    async getGoals() {
        return await db.goals.getItem('list');
    }

    async createGoal(data) {
        const goals = await this.getGoals();
        const newGoal = { _id: generateId(), ...data, createdDate: new Date().toISOString() };
        goals.push(newGoal);
        await db.goals.setItem('list', goals);
        return newGoal;
    }

    async updateGoal(id, data) {
        const goals = await this.getGoals();
        const index = goals.findIndex(g => g._id === id);
        if (index > -1) {
            goals[index] = { ...goals[index], ...data };
            await db.goals.setItem('list', goals);
            return goals[index];
        }
        throw new Error('Goal not found');
    }

    async deleteGoal(id) {
        let goals = await this.getGoals();
        goals = goals.filter(g => g._id !== id);
        await db.goals.setItem('list', goals);
        return { message: 'Goal removed' };
    }

    // --- LOGS ---
    async createLog(data) {
        const logs = await db.logs.getItem('list');
        logs.push({ _id: generateId(), ...data, date: new Date().toISOString() });
        await db.logs.setItem('list', logs);
        return { message: 'Logged' };
    }

    // --- STATS (Simplified Local versions) ---
    async getDashboardStats() {
        const tasks = await this.getTasks();
        const completedToday = tasks.filter(t => t.status === 'completed' && new Date(t.completedDate).toDateString() === new Date().toDateString());
        const activeTasks = tasks.filter(t => t.status === 'pending');
        const focusMins = completedToday.reduce((acc, t) => acc + (t.actualTimeSpent || 0), 0);
        
        return {
            streak: 1, // Mock
            completedTodayCount: completedToday.length,
            activeTasksCount: activeTasks.length,
            totalFocusMinutesToday: focusMins,
            dailyPercentage: activeTasks.length === 0 ? 100 : Math.round((completedToday.length / (completedToday.length + activeTasks.length)) * 100),
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            weeklyTimeData: [0, 0, 0, 0, 0, 0, focusMins]
        };
    }

    async getMonthlyStats() {
        return [
            { month: 'Jan', completedTasks: 0, missedTasks: 0, focusHours: 0 },
            { month: 'Feb', completedTasks: 0, missedTasks: 0, focusHours: 0 }
        ];
    }

    // --- BACKUP ---
    async exportData() {
        return JSON.stringify({
            user: await db.user.getItem('profile'),
            tasks: await db.tasks.getItem('list'),
            goals: await db.goals.getItem('list'),
            logs: await db.logs.getItem('list')
        });
    }

    async importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.user) await db.user.setItem('profile', data.user);
            if (data.tasks) await db.tasks.setItem('list', data.tasks);
            if (data.goals) await db.goals.setItem('list', data.goals);
            if (data.logs) await db.logs.setItem('list', data.logs);
            return { message: 'Data imported successfully' };
        } catch (e) {
            throw new Error('Invalid backup file');
        }
    }
}

export default new LocalDbService();
