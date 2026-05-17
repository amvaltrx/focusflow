import React, { useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import GoalsPage from './pages/GoalsPage.jsx';
import StatsPage from './pages/StatsPage.jsx';

const PrivateLayout = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
        Loading...
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div style={{ marginTop: '2rem' }}>
          {children}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<PrivateLayout><DashboardPage /></PrivateLayout>} />
            <Route path="/tasks" element={<PrivateLayout><TasksPage /></PrivateLayout>} />
            <Route path="/goals" element={<PrivateLayout><GoalsPage /></PrivateLayout>} />
            <Route path="/stats" element={<PrivateLayout><StatsPage /></PrivateLayout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
