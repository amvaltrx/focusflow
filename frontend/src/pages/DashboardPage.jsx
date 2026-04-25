import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../services/api';
import './DashboardPage.css';
import { Flame, CheckCircle, Clock, Timer, AlertCircle, Lightbulb, Activity, Award, Target, ZapOff, HeartPulse, ShieldAlert } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [wellness, setWellness] = useState(null);
  const [consistency, setConsistency] = useState(null);
  const [burnout, setBurnout] = useState(null);
  const [alignment, setAlignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const statsRes = await api.get(`/stats/dashboard?clientMidnight=${encodeURIComponent(startOfToday.toISOString())}`);
        const insightsRes = await api.get('/tasks/procrastination/insights');
        const wellnessRes = await api.get('/stats/wellness-correlation');
        const consistencyRes = await api.get('/stats/advanced-streaks');
        const burnoutRes = await api.get('/stats/burnout-check');
        const alignmentRes = await api.get('/stats/goal-alignment');
        
        setStats(statsRes.data);
        setInsights(insightsRes.data);
        setWellness(wellnessRes.data);
        setConsistency(consistencyRes.data);
        setBurnout(burnoutRes.data);
        setAlignment(alignmentRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Error loading stats</div>;

  const { theme } = React.useContext(ThemeContext);

  const getChartColors = () => {
    switch(theme) {
      case 'purple-black':
        return { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' };
      case 'light':
      case 'lite':
        return { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'red-black':
      default:
        return { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    }
  };

  const colors = getChartColors();

  const chartData = {
    labels: stats.labels,
    datasets: [
      {
        fill: true,
        label: 'Minutes Focused',
        data: stats.weeklyTimeData,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header animate-scale-in">
        <div>
          <h2>Productivity Insights</h2>
          <p className="text-secondary">Track your flow and wellness patterns.</p>
        </div>
        {burnout && (
          <div className={`health-status-badge ${burnout.riskLevel}`}>
            <HeartPulse size={16} />
            <span>Health Check: {burnout.riskLevel === 'low' ? 'Optimal' : burnout.riskLevel === 'medium' ? 'Caution' : 'Burnout Risk'}</span>
          </div>
        )}
      </div>

      {burnout && (burnout.riskLevel === 'medium' || burnout.riskLevel === 'high') && (
        <div className={`burnout-alert glass-panel ${burnout.riskLevel}`}>
          <div className="alert-header">
            <ShieldAlert size={24} />
            <div>
              <h4>Overload Detected</h4>
              <p>Our AI has detected signs of burnout or scheduling overload.</p>
            </div>
          </div>
          <div className="alert-content">
            <div className="warning-section">
              <h5>Warnings:</h5>
              <ul>
                {burnout.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
            <div className="suggestion-section">
              <h5>Recovery Plan:</h5>
              <ul>
                {burnout.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card glass-panel animate-scale-in stagger-1">
          <div className="stat-icon flame">
            <Flame size={24} />
          </div>
          <div className="stat-info">
            <p>Current Streak</p>
            <h3>{stats.streak} Days</h3>
          </div>
        </div>
        <div className="stat-card glass-panel animate-scale-in stagger-2">
          <div className="stat-icon complete">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <p>Completed Today</p>
            <h3>{stats.completedTodayCount}</h3>
          </div>
        </div>
        <div className="stat-card glass-panel animate-scale-in stagger-3">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <p>Active Tasks</p>
            <h3>{stats.activeTasksCount}</h3>
          </div>
        </div>
        <div className="stat-card glass-panel animate-scale-in stagger-4">
          <div className="stat-icon time">
            <Timer size={24} />
          </div>
          <div className="stat-info">
            <p>Focus Time</p>
            <h3>{Math.floor(stats.totalFocusMinutesToday / 60)}h {stats.totalFocusMinutesToday % 60}m</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-main grid-2">
        <div className="glass-panel chart-container animate-fade-in stagger-1">
          <h3>Work Capacity (Minutes)</h3>
          <div className="chart-wrapper">
            <Line options={chartOptions} data={chartData} />
          </div>
        </div>
        
        <div className="glass-panel progress-container animate-fade-in stagger-2">
          <h3>Today's Progress</h3>
          <div className="circular-progress">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="circle"
                strokeDasharray={`${stats.dailyPercentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{stats.dailyPercentage}%</text>
            </svg>
          </div>
          <p className="progress-text">{stats.dailyPercentage}% of your active tasks mapped out for today are completed. Keep pushing!</p>
        </div>
      </div>

      {insights && insights.insights && insights.insights.length > 0 && (
          <div className="procrastination-insights glass-panel animate-fade-in">
              <div className="insights-header">
                  <Lightbulb className="text-accent" size={20} />
                  <h3>Procrastination Insights</h3>
              </div>
              <div className="insights-list">
                  {insights.insights.map((insight, idx) => (
                      <div key={idx} className="insight-item">
                          <AlertCircle size={16} className="text-warning" />
                          <p>{insight}</p>
                      </div>
                  ))}
              </div>
              {insights.flaggedTasks && insights.flaggedTasks.length > 0 && (
                  <div className="flagged-tasks">
                      <h4>Flagged Tasks (Needs Attention):</h4>
                      <div className="flagged-list">
                          {insights.flaggedTasks.slice(0, 3).map(task => (
                              <div key={task.id} className="flagged-item">
                                  <span>{task.title}</span>
                                  <span className="badge-danger">{task.count} delays</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      {wellness && (
          <div className="wellness-correlation glass-panel animate-fade-in">
              <div className="insights-header">
                  <Activity className="text-accent" size={20} />
                  <h3>Productivity & Wellness Correlation</h3>
              </div>
              <div className="wellness-content">
                  <p className="pattern-text">"{wellness.pattern}"</p>
                  {wellness.stats && (
                      <div className="wellness-stats-row">
                          <div className="wellness-mini-card">
                              <span className="label">Avg Mood</span>
                              <span className="value">{wellness.stats.avgMood} / 5</span>
                          </div>
                          <div className="wellness-mini-card">
                              <span className="label">Avg Energy</span>
                              <span className="value">{wellness.stats.avgEnergy} / 5</span>
                          </div>
                          <div className="wellness-mini-card">
                              <span className="label">Total Logs</span>
                              <span className="value">{wellness.stats.totalLogs}</span>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {consistency && (
          <div className="consistency-engine glass-panel animate-fade-in">
              <div className="insights-header">
                  <Award className="text-accent" size={20} />
                  <h3>Consistency Engine</h3>
              </div>
              <div className="consistency-grid">
                  <div className="streak-card">
                      <div className="streak-icon on-time"><Target size={24} /></div>
                      <div className="streak-info">
                          <span className="streak-value">{consistency.onTimeStreak} Days</span>
                          <span className="streak-label">On-Time Completion</span>
                      </div>
                  </div>
                  <div className="streak-card">
                      <div className="streak-icon deep-work"><Timer size={24} /></div>
                      <div className="streak-info">
                          <span className="streak-value">{consistency.deepWorkStreak} Days</span>
                          <span className="streak-label">Deep Work Target (2h)</span>
                      </div>
                  </div>
                  <div className="streak-card">
                      <div className="streak-icon no-delay"><ZapOff size={24} /></div>
                      <div className="streak-info">
                          <span className="streak-value">{consistency.noProcrastinationStreak} Days</span>
                          <span className="streak-label">No Procrastination</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {alignment && (
          <div className="goal-alignment glass-panel animate-fade-in">
              <div className="insights-header">
                  <Target className="text-accent" size={20} />
                  <h3>Goal Alignment Tracking</h3>
              </div>
              <div className="alignment-content">
                  <div className="alignment-stat">
                      <div className="alignment-ring">
                          <svg viewBox="0 0 36 36" className="circular-chart small">
                              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="circle" strokeDasharray={`${alignment.alignmentPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <text x="18" y="20.35" className="percentage">{alignment.alignmentPercentage}%</text>
                          </svg>
                      </div>
                      <div className="alignment-info">
                          <p className="alignment-insight">"{alignment.insight}"</p>
                          <span className="alignment-detail">{alignment.alignedCount} out of {alignment.totalCompleted} tasks were linked to long-term goals.</span>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DashboardPage;
