import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Store, FileText, CheckSquare, Moon, Sun, Menu, X } from 'lucide-react';

const NavBar = ({ isMobile }) => {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-top" style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="logo">
          <Store size={20} />
          Dealer Management
        </div>
        
        {isMobile && (
          <button 
            onClick={toggleMenu} 
            className="menu-toggle"
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
        
        {!isMobile && (
          <ul className="nav-links">
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                <Store size={18} />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/entry" className={location.pathname === '/entry' ? 'active' : ''}>
                <FileText size={18} />
                New Entry
              </Link>
            </li>
            <li>
              <Link to="/verification" className={location.pathname === '/verification' ? 'active' : ''}>
                <CheckSquare size={18} />
                Verification
              </Link>
            </li>
            <li>
              <button onClick={toggleDarkMode} className="theme-toggle" aria-label="Toggle dark mode">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </li>
          </ul>
        )}
      </div>
      
      {/* Mobile Menu */}
      {isMobile && menuOpen && (
        <ul className="nav-links mobile-nav" style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          paddingTop: '0.5rem',
          paddingBottom: '0.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <li>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              <Store size={18} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/entry" 
              className={location.pathname === '/entry' ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              <FileText size={18} />
              New Entry
            </Link>
          </li>
          <li>
            <Link 
              to="/verification" 
              className={location.pathname === '/verification' ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              <CheckSquare size={18} />
              Verification
            </Link>
          </li>
          <li>
            <button 
              onClick={() => {
                toggleDarkMode();
                setMenuOpen(false);
              }} 
              className="theme-toggle" 
              aria-label="Toggle dark mode"
              style={{ justifyContent: 'flex-start', width: '100%', padding: '0.5rem 0' }}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default NavBar;