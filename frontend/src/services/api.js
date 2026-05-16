import LocalDbService from './LocalDbService';

// Initialize the local DB defaults on boot
try {
    LocalDbService.initDefaults().catch(err => console.error('DB Init Error', err));
} catch (e) {
    console.error('Top-level DB Init Crash', e);
}

// Mock the Axios API interface to seamlessly route to LocalDbService
const api = {
    get: async (url, config) => {
        if (url === '/auth/me') return { data: await LocalDbService.getUser() };
        if (url === '/tasks') return { data: await LocalDbService.getTasks() };
        if (url.startsWith('/tasks/smart-schedule')) {
            const urlObj = new URL('http://mock' + url);
            return { data: await LocalDbService.getSmartSchedule(urlObj.searchParams.get('clientHour')) };
        }
        if (url === '/goals') return { data: await LocalDbService.getGoals() };
        if (url.startsWith('/stats/dashboard')) return { data: await LocalDbService.getDashboardStats() };
        if (url === '/stats/monthly') return { data: await LocalDbService.getMonthlyStats() };
        if (url === '/stats/wellness-correlation') return { data: null }; // Mock missing stats safely
        if (url === '/stats/advanced-streaks') return { data: null };
        if (url === '/stats/burnout-check') return { data: null };
        if (url === '/stats/goal-alignment') return { data: null };
        if (url === '/tasks/procrastination/insights') return { data: null };
        
        throw new Error(`Unhandled local GET route: ${url}`);
    },
    post: async (url, data, config) => {
        if (url === '/auth/login' || url === '/auth/register') {
            await LocalDbService.updateUser({ username: data.username });
            return { data: { token: 'local-mock-token' } };
        }
        if (url === '/tasks') return { data: await LocalDbService.createTask(data) };
        if (url === '/tasks/redeem-day-off') return { data: await LocalDbService.redeemDayOff() };
        if (url === '/goals') return { data: await LocalDbService.createGoal(data) };
        if (url === '/logs') return { data: await LocalDbService.createLog(data) };
        if (url === '/notifications/subscribe') return { data: { message: 'Subscribed locally' } };

        throw new Error(`Unhandled local POST route: ${url}`);
    },
    patch: async (url, data, config) => {
        if (url.endsWith('/complete') && url.startsWith('/tasks/')) {
            const id = url.split('/')[2];
            return { data: await LocalDbService.completeTask(id) };
        }
        throw new Error(`Unhandled local PATCH route: ${url}`);
    },
    put: async (url, data, config) => {
        if (url.startsWith('/tasks/')) {
            const id = url.split('/')[2];
            return { data: await LocalDbService.updateTask(id, data) };
        }
        if (url.startsWith('/goals/')) {
            const id = url.split('/')[2];
            return { data: await LocalDbService.updateGoal(id, data) };
        }
        throw new Error(`Unhandled local PUT route: ${url}`);
    },
    delete: async (url, config) => {
        if (url.startsWith('/tasks/')) {
            const id = url.split('/')[2];
            return { data: await LocalDbService.deleteTask(id) };
        }
        if (url.startsWith('/goals/')) {
            const id = url.split('/')[2];
            return { data: await LocalDbService.deleteGoal(id) };
        }
        throw new Error(`Unhandled local DELETE route: ${url}`);
    }
};

export default api;
