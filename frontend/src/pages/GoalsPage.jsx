import React, { useState, useEffect } from 'react';
import { Plus, Target, Trash2, Calendar, Edit3, X } from 'lucide-react';
import api from '../services/api';
import './GoalsPage.css';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState({ title: '', description: '', targetDate: '', color: '#ef4444' });
  const [isEditing, setIsEditing] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/goals/${currentGoal._id}`, currentGoal);
      } else {
        await api.post('/goals', currentGoal);
      }
      fetchGoals();
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteGoal = async (id) => {
    if (window.confirm('Are you sure? This will unlink all associated tasks.')) {
      try {
        await api.delete(`/goals/${id}`);
        fetchGoals();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openAddModal = () => {
    setCurrentGoal({ title: '', description: '', targetDate: '', color: '#ef4444' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (goal) => {
    setCurrentGoal(goal);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentGoal({ title: '', description: '', targetDate: '', color: '#ef4444' });
  };

  if (loading) return <div className="loading">Loading goals...</div>;

  return (
    <div className="goals-page animate-fade-in">
      <div className="goals-header">
        <div>
          <h2>Long-term Goals</h2>
          <p className="text-secondary">Define what matters most and align your daily actions.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> New Goal
        </button>
      </div>

      <div className="goals-grid">
        {goals.map(goal => (
          <div key={goal._id} className="goal-card glass-panel" style={{ borderTop: `4px solid ${goal.color}` }}>
            <div className="goal-card-header">
              <div className="goal-icon" style={{ backgroundColor: `${goal.color}20`, color: goal.color }}>
                <Target size={24} />
              </div>
              <div className="goal-actions">
                <button className="btn-icon" onClick={() => openEditModal(goal)}><Edit3 size={16} /></button>
                <button className="btn-icon text-danger" onClick={() => deleteGoal(goal._id)}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="goal-card-body">
              <h3>{goal.title}</h3>
              <p>{goal.description || 'No description provided.'}</p>
            </div>
            <div className="goal-card-footer">
              <div className="target-date">
                <Calendar size={14} />
                <span>Target: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'No date'}</span>
              </div>
              <span className={`goal-status ${goal.status}`}>{goal.status}</span>
            </div>
          </div>
        ))}
        {goals.length === 0 && (
          <div className="empty-goals glass-panel">
            <Target size={48} className="text-secondary" />
            <p>You haven't defined any goals yet. Start by creating one!</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Goal' : 'Create New Goal'}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
            </div>
            <form className="modal-form" onSubmit={handleSaveGoal}>
              <div className="form-group">
                <label>Goal Title <span className="required">*</span></label>
                <input 
                  type="text" 
                  value={currentGoal.title} 
                  onChange={(e) => setCurrentGoal({...currentGoal, title: e.target.value})}
                  required
                  placeholder="e.g., Master React.js"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={currentGoal.description} 
                  onChange={(e) => setCurrentGoal({...currentGoal, description: e.target.value})}
                  placeholder="Why is this goal important?"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Target Date</label>
                  <input 
                    type="date" 
                    value={currentGoal.targetDate ? currentGoal.targetDate.split('T')[0] : ''} 
                    onChange={(e) => setCurrentGoal({...currentGoal, targetDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Brand Color</label>
                  <input 
                    type="color" 
                    value={currentGoal.color} 
                    onChange={(e) => setCurrentGoal({...currentGoal, color: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
