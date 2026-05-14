import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Heart, Star, Shield } from 'lucide-react';
import './VirtualCompanion.css';

const VirtualCompanion = () => {
    const { user } = useContext(AuthContext);

    if (!user) return null;

    const health = user.companionHealth || 100;
    const level = user.companionLevel || 1;
    const exp = user.companionExp || 0;
    const maxExp = level * 500;

    // Determine companion emotion based on health
    let emotion = "😊";
    let statusText = "Happy & Focused!";
    
    if (health < 30) {
        emotion = "😵";
        statusText = "Exhausted. Complete tasks to heal!";
    } else if (health < 60) {
        emotion = "😟";
        statusText = "Feeling down. Don't miss tasks!";
    }

    return (
        <div className="virtual-companion-widget glass-panel animate-fade-in">
            <div className="companion-header">
                <h3>Focus Pet</h3>
                <div className="companion-level-badge">
                    <Star size={14} fill="currentColor" /> Lvl {level}
                </div>
            </div>
            
            <div className="companion-avatar-container">
                <div className={`companion-avatar health-${Math.floor(health/33)}`}>
                    <span className="companion-emoji animate-bounce">{emotion}</span>
                </div>
            </div>

            <p className="companion-status">{statusText}</p>

            <div className="companion-stats">
                <div className="stat-row">
                    <div className="stat-label">
                        <Heart size={14} className="text-danger" fill="currentColor" /> Health
                    </div>
                    <div className="stat-bar-container">
                        <div className="stat-bar bg-danger" style={{ width: `${health}%` }}></div>
                    </div>
                    <span className="stat-value">{health}/100</span>
                </div>
                
                <div className="stat-row">
                    <div className="stat-label">
                        <Shield size={14} className="text-accent" fill="currentColor" /> EXP
                    </div>
                    <div className="stat-bar-container">
                        <div className="stat-bar bg-accent" style={{ width: `${(exp/maxExp)*100}%` }}></div>
                    </div>
                    <span className="stat-value">{exp}/{maxExp}</span>
                </div>
            </div>
        </div>
    );
};

export default VirtualCompanion;
