import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import VerificationPage from './components/VerificationPage';
import EditDealer from './components/EditDealer';
import NotFound from './components/NotFound';
import { AlertCircle } from 'lucide-react';
import { setupResponsiveTables } from './utils/responsiveTables'; // Import the responsive tables utility
import './index.css';

function App() {
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    lastChecked: Date.now()
  });
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= 768;

  // Check for network status changes
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus({ online: true, lastChecked: Date.now() });
    };

    const handleOffline = () => {
      setNetworkStatus({ online: false, lastChecked: Date.now() });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Track window resize for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initialize responsive tables
    setupResponsiveTables();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Router>
      <div className="app">
        <NavBar isMobile={isMobile} />
        {!networkStatus.online && (
          <div className="network-warning" style={{
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            color: '#e74c3c',
            padding: '0.5rem 1rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            <AlertCircle size={18} />
            You are currently offline. Some features may be limited until your connection is restored.
          </div>
        )}
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard isMobile={isMobile} />} />
            <Route path="/entry" element={<EntryForm isMobile={isMobile} />} />
            <Route path="/verification" element={<VerificationPage isMobile={isMobile} />} />
            <Route path="/edit/:id" element={<EditDealer isMobile={isMobile} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="footer" style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: isMobile ? '0.75rem' : '1rem',
          textAlign: 'center',
          marginTop: 'auto',
          fontSize: isMobile ? '0.85rem' : '1rem'
        }}>
          <p>Dealer Management System &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;