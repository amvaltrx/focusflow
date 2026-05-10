import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error('Auth check failed', err);
            setUser({ username: 'amvaltrx', points: 0 }); 
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const fetchUser = async () => {
      try {
          const res = await api.get('/auth/me');
          setUser(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  const login = async (jwtToken) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    try {
        const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${jwtToken}` }});
        setUser(res.data);
    } catch {
        setUser({ username: 'amvaltrx', points: 0 });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, fetchUser, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
