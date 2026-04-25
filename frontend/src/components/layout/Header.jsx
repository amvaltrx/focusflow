import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Paintbrush, LogOut } from 'lucide-react';
import './Header.css';

const Header = () => {
  const { theme, changeTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);

  const cycleTheme = () => {
    const themes = ['red-black', 'purple-black', 'light', 'lite'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    changeTheme(themes[nextIndex]);
  };

  return (
    <header className="header glass-panel">
      <div className="header-greeting">
        <h3>Hello, {user?.username || 'User'}! 👋</h3>
        <p>Let's maximize your productivity today.</p>
      </div>
      <div className="header-actions">
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
