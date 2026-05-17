import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Paintbrush, LogOut, Bell, BellOff, Star, DownloadCloud } from 'lucide-react';
import NotificationService from '../../services/NotificationService';
import UpdateService from '../../services/UpdateService';
import api from '../../services/api';
import { calculateLevel, UNLOCKABLE_THEMES } from '../../utils/leveling';
import packageInfo from '../../../package.json';
import './Header.css';

const Header = () => {
  const { theme, changeTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    localStorage.getItem('notifications_enabled') === 'true'
  );

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
        localStorage.setItem('notifications_enabled', 'false');
        setNotificationsEnabled(false);
    } else {
        // TURN ON
        const granted = await NotificationService.requestPermission();
        if (granted) {
            await NotificationService.registerServiceWorkerAndSubscribe(api);
            NotificationService.sendNotification("FocusFlow Active! 🎯", "Success! You are now connected for mobile reminders.");
            NotificationService.startReminders(api);
            localStorage.setItem('notifications_enabled', 'true');
            setNotificationsEnabled(true);
        }
    }
  };

  const [updateAvailable, setUpdateAvailable] = React.useState(null);

  React.useEffect(() => {
    const checkUpdates = async () => {
        const update = await UpdateService.checkForUpdates();
        if (update.available) {
            setUpdateAvailable(update);
        }
    };
    checkUpdates();
  }, []);

  React.useEffect(() => {
      if (notificationsEnabled && user) {
          NotificationService.startReminders(api);
      } else {
          NotificationService.stopReminders();
      }
      return () => NotificationService.stopReminders();
  }, [notificationsEnabled, user]);

  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState(0);

  const handleUpdateClick = async (e) => {
    e.preventDefault();
    if (!updateAvailable || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch(updateAvailable.downloadUrl);
      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body.getReader();
      const contentLength = +(response.headers.get('Content-Length') || 11076291); // Fallback to compiled APK size if header missing

      let receivedLength = 0;
      let chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        const percent = Math.round((receivedLength / contentLength) * 100);
        setDownloadProgress(percent > 100 ? 100 : percent);
      }

      const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' });
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `focusflow-v${updateAvailable.newVersion}.apk`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsDownloading(false);
      setDownloadProgress(0);

      // Auto-trigger system Chrome installer to immediately show the "Open / Install" pop up!
      if (window.Capacitor) {
        window.open(updateAvailable.downloadUrl, '_system');
      } else {
        window.location.href = updateAvailable.downloadUrl;
      }
    } catch (err) {
      console.error("In-app download failed:", err);
      setIsDownloading(false);
      setDownloadProgress(0);
      
      // Graceful fallback to opening in native Chrome browser if in-app block occurs
      if (window.Capacitor) {
        window.open(updateAvailable.downloadUrl, '_system');
      } else {
        window.location.href = updateAvailable.downloadUrl;
      }
    }
  };

  return (
    <header className="header glass-panel">
      <div className="header-greeting">
        <h3>
          Hello, {user?.username || 'User'}! 👋 
          <span style={{ fontSize: '11px', opacity: 0.6, padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginLeft: '8px', verticalAlign: 'middle', fontWeight: 'normal' }}>
            v{packageInfo.version}
          </span>
        </h3>
        <p>Let's maximize your productivity today.</p>
      </div>
      <div className="header-actions">
        {isDownloading ? (
          <div className="update-progress-container">
            <div className="update-progress-bar" style={{ width: `${downloadProgress}%` }}></div>
            <span>Downloading {downloadProgress}%</span>
          </div>
        ) : (
          updateAvailable && (
            <button 
              onClick={handleUpdateClick}
              className="update-badge animate-pulse"
              style={{ border: 'none', cursor: 'pointer' }}
              title={`New Version ${updateAvailable.newVersion} available!`}
            >
              <DownloadCloud size={16} />
              <span>Update Available</span>
            </button>
          )
        )}
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
        <button className="theme-cycle-btn" onClick={logout} title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};
export default Header;
