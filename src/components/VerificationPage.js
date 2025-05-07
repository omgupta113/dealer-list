import React, { useState, useEffect } from 'react';
import { getDealersWithBlankStatus, updateDealerStatus, getDealers } from '../services/firebase';
import { CheckCircle, XCircle, AlertCircle, X, Check, CheckSquare, RefreshCw, Search, Clock } from 'lucide-react';

const VerificationPage = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [verificationStats, setVerificationStats] = useState({
    pending: 0,
    completed: 0
  });

  useEffect(() => {
    fetchDealers();
  }, []);

  // In VerificationPage.js
// Check the fetchDealers function

const fetchDealers = async () => {
  setLoading(true);
  try {
    // This function should get dealers with blank status
    const dealersData = await getDealersWithBlankStatus();
    console.log("Dealers with blank status:", dealersData); // Add for debugging
    setDealers(dealersData);
    
    // Update verification stats
    const allDealers = await getDealers();
    const verified = allDealers.filter(dealer => dealer.status === 'verified').length;
    const unverified = allDealers.filter(dealer => dealer.status === 'unverified').length;
    const pending = allDealers.filter(dealer => !dealer.status || dealer.status === '').length;
    
    setVerificationStats({
      pending,
      completed: verified + unverified
    });
  } catch (error) {
    console.error("Error fetching dealers:", error);
    setMessage({
      text: 'Error loading dealers: ' + error.message,
      type: 'error'
    });
  } finally {
    setLoading(false);
  }
};

  const handleStatusUpdate = async (dealerId, status) => {
    setProcessingId(dealerId);
    
    try {
      const result = await updateDealerStatus(dealerId, status);
      
      if (result.success) {
        // Update local state
        setDealers(dealers.filter(dealer => dealer.id !== dealerId));
        
        // Update verification stats
        setVerificationStats(prev => ({
          pending: Math.max(0, prev.pending - 1),
          completed: prev.completed + 1
        }));
        
        setMessage({
          text: `Dealer marked as ${status}`,
          type: 'success'
        });
      } else {
        setMessage({
          text: 'Error updating status: ' + result.error,
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: 'Error updating status: ' + error.message,
        type: 'error'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearMessage = () => {
    setMessage({ text: '', type: '' });
  };

  // Filter dealers based on search term
  const filteredDealers = dealers.filter(dealer => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      dealer.name?.toLowerCase().includes(term) ||
      dealer.city?.toLowerCase().includes(term) ||
      dealer.contactNumber?.includes(term) ||
      dealer.alternateNumber?.includes(term)
    );
  });

  return (
    <div className="verification-page">
      <h1>Dealer Verification</h1>
      
      {/* Verification Stats */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon" style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)', color: '#f39c12' }}>
              <Clock size={20} />
            </div>
            <h3 className="summary-card-title">Pending Verification</h3>
          </div>
          <div className="summary-card-value">{verificationStats.pending}</div>
        </div>
        
        <div className="summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon" style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
              <CheckSquare size={20} />
            </div>
            <h3 className="summary-card-title">Completed Verifications</h3>
          </div>
          <div className="summary-card-value">{verificationStats.completed}</div>
        </div>
      </div>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' && <CheckCircle size={20} />}
          {message.type === 'error' && <AlertCircle size={20} />}
          {message.text}
          <button onClick={clearMessage} className="close-btn" aria-label="Close message" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="form-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Dealers Pending Verification</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search pending dealers..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button className="btn outline primary" onClick={fetchDealers}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {filteredDealers.length > 0 ? (
              <div className="table-container">
                <table className="dealers-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>City</th>
                      <th>Contact Number</th>
                      <th>Alternate Number</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDealers.map((dealer) => (
                      <tr key={dealer.id}>
                        <td>{dealer.name}</td>
                        <td>{dealer.city}</td>
                        <td>{dealer.contactNumber}</td>
                        <td>{dealer.alternateNumber || '-'}</td>
                        <td className="actions">
                          <button
                            className="btn success"
                            onClick={() => handleStatusUpdate(dealer.id, 'verified')}
                            disabled={processingId === dealer.id}
                          >
                            {processingId === dealer.id ? 'Processing...' : (
                              <>
                                <Check size={18} />
                                Verify
                              </>
                            )}
                          </button>
                          <button
                            className="btn danger"
                            onClick={() => handleStatusUpdate(dealer.id, 'unverified')}
                            disabled={processingId === dealer.id}
                          >
                            {processingId === dealer.id ? 'Processing...' : (
                              <>
                                <X size={18} />
                                Reject
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <CheckCircle size={48} color="#2ecc71" />
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>All Caught Up!</h3>
                <p>There are no dealers pending verification at this time.</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Best Practices Section */}
      <div className="form-container" style={{ marginTop: '2rem' }}>
        <h2>Verification Guidelines</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="guideline-card" style={{ border: '1px solid #eee', borderRadius: 'var(--radius)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <CheckCircle size={20} color="#2ecc71" style={{ marginRight: '0.5rem' }} />
              <h3 style={{ margin: 0 }}>When to Verify</h3>
            </div>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li>Contact details have been confirmed</li>
              <li>Dealer information is complete and accurate</li>
              <li>Dealer meets all qualification standards</li>
            </ul>
          </div>
          
          <div className="guideline-card" style={{ border: '1px solid #eee', borderRadius: 'var(--radius)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <XCircle size={20} color="#e74c3c" style={{ marginRight: '0.5rem' }} />
              <h3 style={{ margin: 0 }}>When to Reject</h3>
            </div>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li>Unable to validate contact information</li>
              <li>Dealer information is incorrect or outdated</li>
              <li>Dealer does not meet qualification criteria</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;