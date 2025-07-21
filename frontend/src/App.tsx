import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { store } from './store';
import { AuthProvider } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationSystem from './components/NotificationSystem';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import AppOfflineManager from './components/AppOfflineManager';
import { register as registerSW, setupPWAInstallPrompt } from './utils/serviceWorkerRegistration';
import './App.css';
import { JSX } from 'react/jsx-runtime';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

function App(): JSX.Element {
  useEffect(() => {
    // Register service worker for PWA functionality
    registerSW({
      onSuccess: (registration) => {
        console.log('SW registered: ', registration);
      },
      onUpdate: (registration) => {
        console.log('SW updated: ', registration);
        // You can show a notification to user about the update
      },
    });

    // Setup PWA install prompt
    setupPWAInstallPrompt();
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Router>
            <AuthProvider>
              <AppOfflineManager>
                <div className="App">
                  <Routes>
                    <Route path="/login" element={<LoginForm />} />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                  <NotificationSystem />
                  <PWAInstallPrompt />
                </div>
              </AppOfflineManager>
            </AuthProvider>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;