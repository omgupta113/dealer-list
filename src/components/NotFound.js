import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="not-found" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '70vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ marginBottom: '2rem', color: '#e74c3c' }}>
        <AlertTriangle size={64} />
      </div>
      <h1 style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>404 - Page Not Found</h1>
      <p style={{ marginBottom: '2rem', fontSize: '1.2rem', maxWidth: '600px', color: '#7f8c8d' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn primary">
        <Home size={18} />
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;