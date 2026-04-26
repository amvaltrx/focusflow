class NotificationService {
    constructor() {
        this.reminderInterval = null;
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            console.log("This browser does not support notifications.");
            return false;
        }

        if (Notification.permission === 'granted') return true;

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    sendNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/logo192.png' // Or any app icon
            });
        }
    }

    startReminders(api) {
        if (this.reminderInterval) return;

        // Check every 2 hours (7200000 ms)
        // For testing, I can set it shorter if needed, but 2h is the request.
        const INTERVAL_TIME = 2 * 60 * 60 * 1000;

        this.reminderInterval = setInterval(async () => {
            try {
                const res = await api.get('/tasks');
                const pendingCount = res.data.filter(t => t.status === 'pending').length;

                if (pendingCount > 0) {
                    this.sendNotification(
                        "FocusFlow Reminder 🎯",
                        `You still have ${pendingCount} tasks pending. Ready to get back into focus?`
                    );
                }
            } catch (err) {
                console.error("Failed to check tasks for notification:", err);
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
