import axios from 'axios';

const isProd = import.meta.env.PROD;
const hostname = window.location.hostname;
const isTunnel = hostname.includes('loca.lt');

const api = axios.create({
  baseURL: isProd 
    ? '/api' 
    : isTunnel 
      ? 'https://eleven-bees-wink.loca.lt/api' 
      : `http://${hostname}:5000/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Completely bypass Localtunnel/Ngrok warning screens which trap network requests
  config.headers['Bypass-Tunnel-Reminder'] = 'true';
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

export default api;
