import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Target, BarChart2, Plus } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
    const triggerHaptic = () => {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
    };

    return (
        <nav className="bottom-nav glass-panel">
            <NavLink to="/" onClick={triggerHaptic} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={24} />
                <span>Home</span>
            </NavLink>
            <NavLink to="/tasks" onClick={triggerHaptic} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <CheckSquare size={24} />
                <span>Tasks</span>
            </NavLink>
            
            <div className="bottom-nav-fab-placeholder"></div>
            <button className="bottom-nav-fab" onClick={() => { triggerHaptic(); window.location.hash = '/tasks'; }}>
                <Plus size={32} />
            </button>

            <NavLink to="/goals" onClick={triggerHaptic} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <Target size={24} />
                <span>Goals</span>
            </NavLink>
            <NavLink to="/stats" onClick={triggerHaptic} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <BarChart2 size={24} />
                <span>Stats</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
