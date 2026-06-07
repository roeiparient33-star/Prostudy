import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { TimerProvider } from './contexts/TimerContext';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <TimerProvider>
          <App />
        </TimerProvider>
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
);
