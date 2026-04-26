const PUBLIC_VAPID_KEY = 'BER7NJE-OS3jqXP5Qe70nQxAi-yd0jd92Zq4NN1ATLiHa7K6zpCuelk_EZYkEPCsC9Y61J6JL2Fyh_QXMKaOAQ4';

class NotificationService {
    constructor() {
        this.reminderInterval = null;
    }

    async requestPermission() {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    async registerServiceWorkerAndSubscribe(api) {
        if (!('serviceWorker' in navigator)) return;

        try {
            const register = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            const subscription = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            await api.post('/notifications/subscribe', subscription);
            console.log("Push subscription successful");
            
            // Send immediate confirmation through the worker
            await register.showNotification("FocusFlow Active! 🎯", {
                body: "Success! You are now connected for mobile reminders.",
                icon: '/icon.png',
                vibrate: [200, 100, 200]
            });
        } catch (err) {
            console.error("Service Worker / Push subscription failed:", err);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    sendNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icon.png' });
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
