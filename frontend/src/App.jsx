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

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppLayout = ({ children }) => (
  <>
    <Sidebar />
    <div className="main-content">
      <Header />
      <div style={{ marginTop: '2rem' }}>
        {children}
      </div>
    </div>
  </>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <AppLayout>
              <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
                <Route path="/goals" element={<PrivateRoute><GoalsPage /></PrivateRoute>} />
                <Route path="/stats" element={<PrivateRoute><StatsPage /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AppLayout>
            <BottomNav />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
