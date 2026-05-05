import React, { useEffect, useState } from 'react';
import { BarChart2, Activity, Clock, Target } from 'lucide-react';
import api from '../services/api';
import './StatsPage.css';

const StatsPage = () => {
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/stats/monthly');
                setMonthlyData(res.data);
            } catch (err) {
                console.error("Error fetching stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="stats-page"><div className="stats-loading">Loading statistics...</div></div>;

    const maxTasks = Math.max(...monthlyData.map(d => Math.max(d.completedTasks, d.missedTasks || 0)), 1);
    const maxFocus = Math.max(...monthlyData.map(d => d.focusHours), 1);

    return (
        <div className="stats-page animate-fade-in">
            <div className="stats-header">
                <h2><BarChart2 size={24} /> Performance & Monthly Stats</h2>
                <p>Track your productivity and focus trends over the past year.</p>
            </div>

            <div className="stats-grid">
                <div className="stats-card glass-panel animate-slide-in stagger-1">
                    <h3><Target size={18} /> Tasks Completed</h3>
                    <div className="chart-container">
                        {monthlyData.map((data, index) => (
                            <div key={index} className="chart-bar-group">
                                <div className="chart-bar-wrapper multi-bar">
                                    <div 
                                        className="chart-bar tasks-bar" 
                                        style={{ height: `${(data.completedTasks / maxTasks) * 100}%` }}
                                        title={`${data.completedTasks} completed`}
                                    ></div>
                                    <div 
                                        className="chart-bar missed-bar" 
                                        style={{ height: `${((data.missedTasks || 0) / maxTasks) * 100}%` }}
                                        title={`${data.missedTasks || 0} missed`}
                                    ></div>
                                </div>
                                <span className="chart-label">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="stats-card glass-panel animate-slide-in stagger-2">
                    <h3><Clock size={18} /> Focus Hours</h3>
                    <div className="chart-container">
                        {monthlyData.map((data, index) => (
                            <div key={index} className="chart-bar-group">
                                <div className="chart-bar-wrapper">
                                    <div 
                                        className="chart-bar focus-bar" 
                                        style={{ height: `${(data.focusHours / maxFocus) * 100}%` }}
                                        title={`${data.focusHours} hrs`}
                                    ></div>
                                </div>
                                <span className="chart-label">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="stats-summary glass-panel animate-slide-in stagger-3">
                <h3><Activity size={18} /> Year in Review</h3>
                <div className="summary-stats">
                    <div className="summary-item">
                        <span className="summary-value text-accent">{monthlyData.reduce((sum, d) => sum + d.completedTasks, 0)}</span>
                        <span className="summary-label">Completed</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-value text-danger">{monthlyData.reduce((sum, d) => sum + (d.missedTasks || 0), 0)}</span>
                        <span className="summary-label">Missed</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-value text-success">{Math.round(monthlyData.reduce((sum, d) => sum + d.focusHours, 0))}</span>
                        <span className="summary-label">Focus Hours</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;
