import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';
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
  <div className="app-container animate-fade-in">
    <Sidebar />
    <div className="main-content">
      <Header />
      <div style={{ marginTop: '2rem' }}>
        {children}
      </div>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <AppLayout><DashboardPage /></AppLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <PrivateRoute>
                  <AppLayout><TasksPage /></AppLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/goals" 
              element={
                <PrivateRoute>
                  <AppLayout><GoalsPage /></AppLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/stats" 
              element={
                <PrivateRoute>
                  <AppLayout><StatsPage /></AppLayout>
                </PrivateRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
