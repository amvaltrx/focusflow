import { LocalNotifications } from '@capacitor/local-notifications';

class NotificationService {
    constructor() {
        this.reminderInterval = null;
    }

    async requestPermission() {
        if (window.Capacitor) {
            try {
                const perm = await LocalNotifications.checkPermissions();
                if (perm.display !== 'granted') {
                    const req = await LocalNotifications.requestPermissions();
                    return req.display === 'granted';
                }
                return true;
            } catch (err) {
                console.error("Failed to request native notification permissions:", err);
                return false;
            }
        }
        
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    async registerServiceWorkerAndSubscribe(api) {
        // Disabling push notifications since local notifications are completely active and native
        console.log("Local native notifications active. Subscriptions bypassed.");
        return;
    }

    async sendNotification(title, body) {
        if (window.Capacitor) {
            try {
                const isGranted = await this.requestPermission();
                if (isGranted) {
                    await LocalNotifications.schedule({
                        notifications: [
                            {
                                title: title,
                                body: body,
                                id: Math.floor(Math.random() * 100000),
                                schedule: { at: new Date(Date.now() + 500) } // Deliver instantly in 0.5s
                            }
                        ]
                    });
                }
            } catch (err) {
                console.error("Failed to trigger native local notification:", err);
            }
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.svg' });
        }
    }

    startReminders(api) {
        if (this.reminderInterval) return;
        const INTERVAL_TIME = 2 * 60 * 60 * 1000;
        this.reminderInterval = setInterval(async () => {
            try {
                const res = await api.get('/tasks');
                const pendingCount = res.data.filter(t => t.status === 'pending').length;
                if (pendingCount > 0) {
                    this.sendNotification("FocusFlow Reminder 🎯", `You have ${pendingCount} tasks pending.`);
                }
            } catch (err) {
                console.error("Reminder check failed:", err);
            }
        }, INTERVAL_TIME);
    }

    stopReminders() {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = null;
        }
    }
}

export default new NotificationService();
