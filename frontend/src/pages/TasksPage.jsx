import React, { useEffect, useState, useRef, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, GripVertical, Check, Trash2, Edit3, X, Play, Pause, Square, Search, Filter, Sparkles, Target, Calendar, Timer, Clock, Minus } from 'lucide-react';
import api from '../services/api';
import './TasksPage.css';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    allocatedTime: 25,
    isAllDay: false,
    priority: 'medium',
    category: 'Work',
    deadline: '',
    goalId: ''
  });

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Focus Timer State
  const [activeFocusTask, setActiveFocusTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const timerRef = useRef(null);

  // Smart Plan State
  const [smartPlan, setSmartPlan] = useState(null);
  const [showSmartPlan, setShowSmartPlan] = useState(false);
  const [isMicroMode, setIsMicroMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
      try {
          const res = await api.get('/goals');
          setGoals(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {
    fetchTasks();
    fetchGoals();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      // Time is up!
      clearInterval(timerRef.current);
      setIsTimerRunning(false);
      // Optional: auto-complete or notify
    }

    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, timeLeft]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(tasks);
    const pendingItems = tasks.filter(t => t.status === 'pending');
    if (result.source.droppableId === 'pending-list' && result.destination.droppableId === 'pending-list') {
        const [reorderedItem] = pendingItems.splice(result.source.index, 1);
        pendingItems.splice(result.destination.index, 0, reorderedItem);
        setTasks([...pendingItems, ...tasks.filter(t => t.status !== 'pending')]);
    }
  };

  const openAddModal = () => {
    setEditingTaskId(null);
    setFormData({ title: '', description: '', allocatedTime: 25, isAllDay: false, priority: 'medium', category: 'Work', deadline: '', goalId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTaskId(task._id);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      allocatedTime: task.allocatedTime || 25,
      isAllDay: task.isAllDay || false,
      priority: task.priority || 'medium',
      category: task.category || 'Work',
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      goalId: task.goalId || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTaskId(null);
  };

  const handleFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const payload = { ...formData };
    if (payload.deadline === '') {
        payload.deadline = null;
    }

    const isEditing = !!editingTaskId;
    let oldTasks = [...tasks];
    
    try {
      if (isEditing) {
        const tempTask = { ...tasks.find(t => t._id === editingTaskId), ...payload };
        setTasks(tasks.map(t => t._id === editingTaskId ? tempTask : t));
        const res = await api.put(`/tasks/${editingTaskId}`, payload);
        setTasks(tasks.map(t => t._id === editingTaskId ? res.data : t));
      } else {
        const res = await api.post('/tasks', payload);
        setTasks([res.data, ...oldTasks]);
      }
      closeModal();
    } catch (err) {
      console.error(err);
      setTasks(oldTasks);
    }
  };

  const completeTask = async (id) => {
    setTasks(tasks.map(t => t._id === id ? { ...t, status: 'completed' } : t));
    try {
      await api.patch(`/tasks/${id}/complete`);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    setTasks(tasks.filter(t => t._id !== id));
    try {
      await api.delete(`/tasks/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Focus Timer Functions
  const startFocusTimer = (task, useMicro = false) => {
      setActiveFocusTask(task);
      setIsMicroMode(useMicro);
      setTimeLeft(useMicro ? 15 * 60 : (task.allocatedTime || 25) * 60);
      setSessionSeconds(0);
      setSessionStartTime(new Date());
      setIsTimerRunning(true);
      setIsMinimized(false);
  };

  const postponeTask = async (id) => {
      try {
          const res = await api.post(`/tasks/${id}/postpone`);
          setTasks(tasks.map(t => t._id === id ? res.data : t));
      } catch (err) {
          console.error(err);
      }
  };

  const syncFocusTime = async (task, seconds) => {
      try {
          const totalSpent = (task.actualTimeSpent || 0) + seconds;
          await api.put(`/tasks/${task._id}`, { actualTimeSpent: totalSpent });
          // Update local state to reflect new time
          setTasks(prev => prev.map(t => t._id === task._id ? { ...t, actualTimeSpent: totalSpent } : t));
      } catch (err) {
          console.error("Failed to sync focus time:", err);
      }
  };

  const endFocusTimer = async () => {
      if (activeFocusTask && sessionSeconds > 0) {
          syncFocusTime(activeFocusTask, sessionSeconds);
          // Log session to backend for smart scheduling
          try {
              await api.post('/tasks/focus-session', {
                  taskId: activeFocusTask._id,
                  startTime: sessionStartTime,
                  endTime: new Date(),
                  duration: sessionSeconds
              });
          } catch (err) {
              console.error("Failed to log focus session:", err);
          }
      }
      setIsTimerRunning(false);
      setActiveFocusTask(null);
      setSessionSeconds(0);
      setSessionStartTime(null);
      setIsMicroMode(false);
      setIsMinimized(false);
      clearInterval(timerRef.current);
  };

  const toggleTimer = () => {
      setIsTimerRunning(!isTimerRunning);
      // Sync on pause for safety
      if (isTimerRunning && activeFocusTask && sessionSeconds > 0) {
          syncFocusTime(activeFocusTask, sessionSeconds);
          setSessionSeconds(0);
      }
  };

  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const focusTimerCompleteAndClose = async () => {
      if (activeFocusTask) {
          await syncFocusTime(activeFocusTask, sessionSeconds);
          completeTask(activeFocusTask._id);
      }
      await endFocusTimer(); // Use await here
  };

  // Smart Scheduling Actions
  const fetchSmartPlan = async () => {
      setLoading(true);
      try {
          const res = await api.get('/tasks/smart-schedule');
          setSmartPlan(res.data);
          setShowSmartPlan(true);
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  // Advanced Filtering & Sorting Engine
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(term) || 
        (t.description && t.description.toLowerCase().includes(term))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    // 3. Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // 4. Priority Filter
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    // 5. Date Filter Logic
    if (dateFilter !== 'all') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      result = result.filter(t => {
        if (!t.deadline) return false;
        const taskDate = new Date(t.deadline);
        taskDate.setHours(0,0,0,0);

        if (dateFilter === 'today') {
          return taskDate.getTime() === now.getTime();
        }
        if (dateFilter === 'overdue') {
          return taskDate.getTime() < now.getTime() && t.status !== 'completed';
        }
        if (dateFilter === 'upcoming') {
          return taskDate.getTime() >= tomorrow.getTime();
        }
        return true;
      });
    }

    // 6. Sorting Engine
    result.sort((a, b) => {
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (sortBy === 'priority') {
        const priorityMap = { high: 3, medium: 2, low: 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    return result;
  }, [tasks, searchTerm, statusFilter, dateFilter, categoryFilter, priorityFilter, sortBy]);

  const isFiltered = searchTerm !== '' || statusFilter !== 'all' || dateFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || sortBy !== 'newest';

  if (loading) return <div>Loading tasks...</div>;

  const pendingTasks = filteredAndSortedTasks.filter(t => t.status === 'pending');
  const completedTasks = filteredAndSortedTasks.filter(t => t.status === 'completed');

  return (
    <div className="tasks-page animate-fade-in">
      <div className="tasks-header">
        <h2>Your Tasks</h2>
        <div className="tasks-actions-main">
            <button className="btn btn-secondary" onClick={fetchSmartPlan}>
                <Sparkles size={18}/> Smart Schedule
            </button>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18}/> Add New Task
            </button>
        </div>
      </div>

      {showSmartPlan && smartPlan && (
          <div className="smart-plan-section glass-panel animate-fade-in">
              <div className="smart-plan-header">
                  <h3><Sparkles size={18} className="text-accent" /> AI Optimized Plan for Today</h3>
                  <button className="btn-icon" onClick={() => setShowSmartPlan(false)}><X size={18}/></button>
              </div>
              <p className="smart-plan-subtitle">Based on your past behavior, we've matched your tasks to your peak energy windows.</p>
              
              <div className="smart-plan-grid">
                  {smartPlan.suggestedSchedule.map((item, idx) => (
                      <div key={idx} className={`smart-plan-item ${item.hourType}`}>
                          <div className="hour-tag">{item.scheduledHour}:00</div>
                          <div className="task-mini-card">
                              <span className="recommendation-badge">{item.recommendation}</span>
                              <h4>{item.task.title}</h4>
                              <span className={`priority-mini ${item.task.priority}`}>{item.task.priority}</span>
                          </div>
                      </div>
                  ))}
                  {smartPlan.suggestedSchedule.length === 0 && <p>No pending tasks to schedule. Great job!</p>}
              </div>
          </div>
      )}

      <div className="filter-bar glass-panel">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Date</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="all">Any Date</option>
              <option value="today">Due Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Study">Study</option>
              <option value="Health">Health</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Priority</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">Any Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      <div className="tasks-lists">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="task-list glass-panel">
            <h3>Pending ({pendingTasks.length}) {isFiltered && <span className="filter-label">(Filtered)</span>}</h3>
            <Droppable droppableId="pending-list" isDropDisabled={isFiltered}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="droppable-area">
                  {pendingTasks.map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided) => (
                        <div 
                          className="task-item pending-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div {...provided.dragHandleProps} className="drag-handle">
                            <GripVertical size={16} />
                          </div>
                          <div className="task-content">
                            <h4>{task.title}</h4>
                            {task.description && <p className="task-desc">{task.description}</p>}
                            <div className="task-meta">
                                <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                                <span className="category-badge">{task.category}</span>
                                {task.isAllDay ? (
                                    <span className="all-day-badge">All Day</span>
                                ) : (
                                    task.allocatedTime && <span className="deadline-badge">{task.allocatedTime}m Focus</span>
                                )}
                                {task.deadline && <span className="deadline-badge">Due: {new Date(task.deadline).toLocaleDateString()}</span>}
                                {task.goalId && goals.find(g => g._id === task.goalId) && (
                                    <span className="goal-badge" style={{ 
                                        borderColor: goals.find(g => g._id === task.goalId)?.color, 
                                        color: goals.find(g => g._id === task.goalId)?.color 
                                    }}>
                                        <Target size={12} /> {goals.find(g => g._id === task.goalId)?.title}
                                    </span>
                                )}
                            </div>
                          </div>
                          <div className="task-actions">
                            {task.isAllDay ? (
                                <div className="day-target-icon" title="Day-long Target">
                                    <Target size={18} className="text-accent" />
                                </div>
                            ) : (
                                <button className="btn-icon text-accent focus-play-btn" onClick={() => startFocusTimer(task)} title="Start Focus Mode">
                                  <Play size={18} fill="currentColor" />
                                </button>
                            )}
                            {task.postponedCount > 0 && !task.isAllDay && (
                                <button className="btn-icon text-warning" onClick={() => startFocusTimer(task, true)} title="Start 15-min Micro-deadline">
                                    <Timer size={18} />
                                </button>
                            )}
                            <button className="btn-icon text-accent" onClick={() => openEditModal(task)} title="Edit">
                              <Edit3 size={18} />
                            </button>
                            <button className="btn-icon text-warning" onClick={() => postponeTask(task._id)} title="Postpone to tomorrow">
                                <Clock size={18} />
                            </button>
                            <button className="btn-icon text-success" onClick={() => completeTask(task._id)} title="Complete">
                              <Check size={18} />
                            </button>
                            <button className="btn-icon text-danger" onClick={() => deleteTask(task._id)} title="Delete">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>

        <div className="task-list glass-panel completed-list">
          <h3>Completed ({completedTasks.length})</h3>
          <div className="droppable-area">
            {completedTasks.map(task => (
              <div key={task._id} className="task-item completed-item">
                <div className="task-content">
                   <h4>{task.title}</h4>
                   <div className="task-meta">
                        <span className="category-badge">{task.category}</span>
                   </div>
                </div>
                <div className="task-actions">
                    <button className="btn-icon text-danger" onClick={() => deleteTask(task._id)} title="Delete">
                      <Trash2 size={18} />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>{editingTaskId ? 'Edit Task' : 'Create New Task'}</h3>
              <button type="button" className="btn-icon" onClick={closeModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveTask} className="modal-form">
              <div className="form-group">
                <label>Title <span className="required">*</span></label>
                <input required type="text" name="title" className="input-field" value={formData.title} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" className="input-field" rows="2" value={formData.description} onChange={handleFormChange}></textarea>
              </div>
              <div className="form-row">
                  <div className="form-group checkbox-group all-day-row">
                    <label className="checkbox-label">
                        <input type="checkbox" name="isAllDay" checked={formData.isAllDay} onChange={handleFormChange} />
                        <span className="checkbox-text">Applicable Whole Day (Day Target)</span>
                    </label>
                  </div>
              </div>
              <div className="form-row">
                  {!formData.isAllDay && (
                      <div className="form-group">
                        <label>Time (Mins)</label>
                        <input type="number" min="1" max="1440" name="allocatedTime" className="input-field" value={formData.allocatedTime} onChange={handleFormChange} />
                      </div>
                  )}
                  <div className="form-group">
                    <label>Priority</label>
                    <select name="priority" className="input-field" value={formData.priority} onChange={handleFormChange}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" className="input-field" value={formData.category} onChange={handleFormChange}>
                        <option value="Work">Work</option>
                        <option value="Personal">Personal</option>
                        <option value="Study">Study</option>
                        <option value="Health">Health</option>
                        <option value="Uncategorized">Uncategorized</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Deadline</label>
                    <input type="date" name="deadline" className="input-field" value={formData.deadline} onChange={handleFormChange} />
                  </div>
              </div>
              <div className="form-group">
                  <label>Link to Long-term Goal</label>
                  <select name="goalId" className="input-field" value={formData.goalId} onChange={handleFormChange}>
                      <option value="">No specific goal</option>
                      {goals.map(g => <option key={g._id} value={g._id}>{g.title}</option>)}
                  </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTaskId ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeFocusTask && !isMinimized && (
          <div className="focus-overlay animate-fade-in">
              <button className="btn-minimize" onClick={() => setIsMinimized(true)} title="Minimize to Corner">
                  <Minus size={20} />
              </button>
              <div className="focus-content">
                  <p className="focus-category">{activeFocusTask.category} {isMicroMode && <span className="micro-tag">• Micro-Deadline</span>}</p>
                  <h1 className="focus-title">{activeFocusTask.title}</h1>
                  
                  <div className={`focus-timer-display ${timeLeft === 0 ? 'times-up pulse' : ''}`}>
                      {timeLeft > 0 ? formatTime(timeLeft) : '00:00'}
                  </div>
                  
                  {timeLeft === 0 && <p className="times-up-msg animate-fade-in">Time's Up! Great focus.</p>}

                  <div className="focus-controls">
                      {timeLeft > 0 && (
                          <button className="btn focus-btn" onClick={toggleTimer}>
                              {isTimerRunning ? <Pause size={24}/> : <Play size={24} fill="currentColor"/>}
                          </button>
                      )}
                      {timeLeft === 0 && (
                           <button className="btn btn-success focus-btn" onClick={focusTimerCompleteAndClose}>
                              <Check size={24}/> Complete Task
                           </button>
                      )}
                      <button className="btn focus-btn-danger" onClick={endFocusTimer}>
                          <Square size={24}/> Quit
                      </button>
                  </div>
              </div>
          </div>
      )}

      {activeFocusTask && isMinimized && (
          <div className="mini-timer glass-panel animate-slide-up" onClick={() => setIsMinimized(false)}>
              <div className="mini-timer-info">
                  <span className="mini-timer-title">{activeFocusTask.title}</span>
                  <span className="mini-timer-clock">{formatTime(timeLeft)}</span>
              </div>
              <div className="mini-timer-controls" onClick={(e) => e.stopPropagation()}>
                  <button className="mini-btn" onClick={toggleTimer}>
                      {isTimerRunning ? <Pause size={14}/> : <Play size={14} fill="currentColor"/>}
                  </button>
                  <button className="mini-btn text-danger" onClick={endFocusTimer}>
                      <Square size={14}/>
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};
export default TasksPage;
