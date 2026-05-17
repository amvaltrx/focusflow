import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './theme.css'
import './index.css'

// Disable and unregister PWA Service Workers inside native Capacitor wrapper to prevent cached updates block
if (window.Capacitor || (window.Capacitor && 'serviceWorker' in navigator)) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Successfully unregistered stale PWA Service Worker inside Capacitor');
          window.location.reload();
        }
      });
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
