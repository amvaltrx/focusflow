import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Paintbrush, LogOut, Bell, BellOff } from 'lucide-react';
import NotificationService from '../../services/NotificationService';
import api from '../../services/api';
import './Header.css';

const Header = () => {
  const { theme, changeTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(Notification.permission === 'granted');

  const cycleTheme = () => {
    const themes = ['red-black', 'purple-black', 'light', 'lite'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    changeTheme(themes[nextIndex]);
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
        // TURN OFF
        NotificationService.stopReminders();
        setNotificationsEnabled(false);
    } else {
        // TURN ON
        const granted = await NotificationService.requestPermission();
        if (granted) {
            await NotificationService.registerServiceWorkerAndSubscribe(api);
            NotificationService.sendNotification("FocusFlow Active! 🎯", "Success! You are now connected for mobile reminders.");
            NotificationService.startReminders(api);
            setNotificationsEnabled(true);
        }
    }
  };

  React.useEffect(() => {
      if (notificationsEnabled && user) {
          NotificationService.startReminders(api);
      } else {
          NotificationService.stopReminders();
      }
      return () => NotificationService.stopReminders();
  }, [notificationsEnabled, user]);

  return (
    <header className="header glass-panel">
      <div className="header-greeting">
        <h3>Hello, {user?.username || 'User'}! 👋</h3>
        <p>Let's maximize your productivity today.</p>
      </div>
      <div className="header-actions">
        <button 
          className={`notif-btn ${notificationsEnabled ? 'notif-on' : 'notif-off'}`} 
          onClick={handleToggleNotifications}
          title={notificationsEnabled ? "Notifications: ON" : "Notifications: OFF"}
        >
          {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
        <button 
          className="theme-cycle-btn" 
          onClick={cycleTheme}
          title={`Current Theme: ${theme}`}
        >
          <Paintbrush size={20} />
        </button>
        <button className="btn btn-ghost" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </header>
  );
};
export default Header;
