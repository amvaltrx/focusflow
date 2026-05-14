import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Paintbrush, LogOut, Bell, BellOff, Star } from 'lucide-react';
import NotificationService from '../../services/NotificationService';
import api from '../../services/api';
import { calculateLevel, UNLOCKABLE_THEMES } from '../../utils/leveling';
import './Header.css';

const Header = () => {
  const { theme, changeTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(Notification.permission === 'granted');

  const { level } = calculateLevel(user?.totalXp || 0);

  const cycleTheme = () => {
    const availableThemes = UNLOCKABLE_THEMES.filter(t => level >= t.reqLevel).map(t => t.id);
    const currentIndex = availableThemes.indexOf(theme) !== -1 ? availableThemes.indexOf(theme) : 0;
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    changeTheme(availableThemes[nextIndex]);
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
        <div className="points-badge" title="Earn points by completing tasks!">
            <Star size={18} className="text-warning" fill="currentColor" />
            <span>{user?.points || 0} Pts</span>
        </div>
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
