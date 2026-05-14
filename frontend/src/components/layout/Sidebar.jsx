import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Settings, Smile, Zap, Send, Target, BarChart2, MonitorPlay, Download, Upload } from 'lucide-react';
import api from '../../services/api';
import LocalDbService from '../../services/LocalDbService';
import ZenMode from '../ZenMode';
import { AuthContext } from '../../context/AuthContext';
import { calculateLevel } from '../../utils/leveling';
import './Sidebar.css';

const Sidebar = () => {
  const [mood, setMood] = React.useState(3);
  const [energy, setEnergy] = React.useState(3);
  const [lastLog, setLastLog] = React.useState(null);
  const [showZenMode, setShowZenMode] = React.useState(false);
  const { user } = React.useContext(AuthContext);

  const { level, title, progressPercent } = calculateLevel(user?.totalXp || 0);

  const submitLog = async () => {
      try {
          await api.post('/logs', { mood, energy });
          setLastLog(new Date());
          alert('Wellness log saved!');
      } catch (err) {
          console.error(err);
      }
  };

  const handleExport = async () => {
      const data = await LocalDbService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
  };

  const handleImport = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              await LocalDbService.importData(event.target.result);
              alert('Data imported successfully! App will now reload.');
              window.location.reload();
          } catch (err) {
              alert('Failed to import data. Invalid backup file.');
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-logo animate-float">
        <h2 className="logo-text">Focus<span>Flow</span></h2>
      </div>

      <div className="player-profile glass-panel animate-fade-in stagger-1">
        <div className="profile-header">
            <span className="profile-title">{title}</span>
            <span className="profile-level">Lvl {level}</span>
        </div>
        <div className="xp-bar-container" title={`${Math.round(progressPercent)}% to next level`}>
            <div className="xp-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} animate-slide-in stagger-1`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} animate-slide-in stagger-2`}>
          <CheckSquare size={20} />
          <span>Tasks</span>
        </NavLink>
        <NavLink to="/goals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} animate-slide-in stagger-3`}>
          <Target size={20} />
          <span>Goals</span>
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} animate-slide-in stagger-4`}>
          <BarChart2 size={20} />
          <span>Stats</span>
        </NavLink>
        <button 
          onClick={() => setShowZenMode(true)} 
          className="nav-item animate-slide-in stagger-4"
          style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem' }}
        >
          <MonitorPlay size={20} />
          <span>Zen Mode</span>
        </button>
      </nav>

      {showZenMode && <ZenMode onClose={() => setShowZenMode(false)} />}

      <div className="wellness-widget glass-panel">
          <div className="widget-header">
              <Smile size={18} />
              <span>How are you?</span>
          </div>
          
          <div className="log-controls">
              <div className="control-item">
                  <label>Mood</label>
                  <input type="range" min="1" max="5" value={mood} onChange={(e) => setMood(parseInt(e.target.value))} />
                  <span className="value-label">{['😢','😕','😐','🙂','🤩'][mood-1]}</span>
              </div>
              <div className="control-item">
                  <label>Energy</label>
                  <input type="range" min="1" max="5" value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} />
                  <span className="value-label">{['🪫','🔋','⚡','🔥','🚀'][energy-1]}</span>
              </div>
              <button className="btn btn-primary btn-sm w-full" onClick={submitLog}>
                  <Send size={14} /> Log Now
              </button>
              {lastLog && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
                      Last updated: {lastLog.toLocaleTimeString()}
                  </div>
              )}
          </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button className="btn btn-ghost btn-sm w-full" onClick={handleExport} style={{ fontSize: '0.75rem', padding: '0.5rem' }}>
              <Download size={14} /> Backup
          </button>
          <label className="btn btn-ghost btn-sm w-full" style={{ fontSize: '0.75rem', padding: '0.5rem', cursor: 'pointer', margin: 0, textAlign: 'center' }}>
              <Upload size={14} /> Restore
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
      </div>
    </div>
  );
};
export default Sidebar;
