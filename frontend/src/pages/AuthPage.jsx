import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AuthPage.css';

const AuthPage = () => {
  const [username, setUsername] = useState('');
  const { login } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      const res = await api.post('/auth/login', { username });
      login(res.data.token);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`auth-container theme-${theme}`}>
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <h2 className="logo-text">Focus<span>Flow</span></h2>
          <p>Welcome! Enter your name to setup your offline profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>What should we call you?</label>
            <input 
              type="text" 
              name="username" 
              className="input-field" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              placeholder="e.g. Alex"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Start Focusing
          </button>
        </form>
      </div>
    </div>
  );
};
export default AuthPage;
