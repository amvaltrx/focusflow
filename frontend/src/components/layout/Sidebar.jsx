import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Settings, Smile, Zap, Send, Target, BarChart2 } from 'lucide-react';
import api from '../../services/api';
import './Sidebar.css';

const Sidebar = () => {
  const [mood, setMood] = React.useState(3);
  const [energy, setEnergy] = React.useState(3);
  const [isLogging, setIsLogging] = React.useState(false);
  const [lastLog, setLastLog] = React.useState(null);

  const submitLog = async () => {
      try {
          await api.post('/logs', { mood, energy });
          setLastLog(new Date());
          setIsLogging(false);
          alert('Wellness log saved!');
      } catch (err) {
          console.error(err);
      }
  };
  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-logo animate-float">
        <h2 className="logo-text">Focus<span>Flow</span></h2>
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
      </nav>

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
          </div>
      </div>
    </div>
  );
};
export default Sidebar;
