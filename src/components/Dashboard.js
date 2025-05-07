import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getFilteredDealers } from '../services/firebase';
import Icons from '../utils/Icons';
import { CSVLink } from '../utils/csvExport';

const Dashboard = ({ isMobile }) => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(!isMobile); // Start collapsed on mobile
  const [summaryData, setSummaryData] = useState({
    totalDealers: 0,
    verifiedDealers: 0,
    unverifiedDealers: 0,
    pendingVerification: 0,
  });
  
  const itemsPerPage = isMobile ? 5 : 10; // Fewer items per page on mobile

  // Using useCallback to memoize the fetchDealers function
  const fetchDealers = useCallback(async () => {
    setLoading(true);
    try {
      // This is the key fix - properly handle 'blank' status for pending verification
      let statusParam = statusFilter;
      if (statusFilter === 'pending') {
        statusParam = 'blank';
      }
      
      const dealersData = await getFilteredDealers(
        statusParam || null,
        cityFilter || null
      );
      
      // Calculate summary data
      const verified = dealersData.filter(dealer => dealer.status === 'verified').length;
      const unverified = dealersData.filter(dealer => dealer.status === 'unverified').length;
      const pending = dealersData.filter(dealer => !dealer.status || dealer.status === '').length;
      
      setSummaryData({
        totalDealers: dealersData.length,
        verifiedDealers: verified,
        unverifiedDealers: unverified,
        pendingVerification: pending,
      });
      
      setDealers(dealersData);
      
      // Extract unique cities for filter dropdown
      if (dealersData.length > 0) {
        const uniqueCities = [...new Set(dealersData.map(dealer => dealer.city))].sort();
        setCities(uniqueCities);
      }
    } catch (error) {
      console.error("Error fetching dealers:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cityFilter]); // Dependencies for useCallback

  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]); // fetchDealers is now included in dependency array

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleCityChange = (e) => {
    setCityFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const resetFilters = () => {
    setStatusFilter('');
    setCityFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
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

  // Pagination
  const totalPages = Math.ceil(filteredDealers.length / itemsPerPage);
  const paginatedDealers = filteredDealers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Export data
  const csvData = filteredDealers.map(dealer => ({
    Name: dealer.name,
    City: dealer.city,
    'Contact Number': dealer.contactNumber,
    'Alternate Number': dealer.alternateNumber || '',
    Status: dealer.status || 'Pending'
  }));

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '-';
    
    // Format as XXX-XXX-XXXX if it's a 10-digit number
    if (phoneNumber.length === 10) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    }
    
    return phoneNumber;
  };

  return (
    <div className="dashboard">
      <h1>Dealer Contact Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}>
              <Icons.Users size={isMobile ? 16 : 20} />
            </div>
            <h3 className="summary-card-title">Total Dealers</h3>
          </div>
          <div className="summary-card-value">{summaryData.totalDealers}</div>
        </div>
        
        <div className="summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon" style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
              <Icons.Check size={isMobile ? 16 : 20} />
            </div>
            <h3 className="summary-card-title">Verified Dealers</h3>
          </div>
          <div className="summary-card-value">{summaryData.verifiedDealers}</div>
        </div>
        
        <div className="summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon" style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}>
              <Icons.AlertTriangle size={isMobile ? 16 : 20} />
            </div>
            <h3 className="summary-card-title">Unverified Dealers</h3>
          </div>
          <div className="summary-card-value">{summaryData.unverifiedDealers}</div>
        </div>
        
        <div className="summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon" style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)', color: '#f39c12' }}>
              <Icons.AlertTriangle size={isMobile ? 16 : 20} />
            </div>
            <h3 className="summary-card-title">Pending Verification</h3>
          </div>
          <div className="summary-card-value">{summaryData.pendingVerification}</div>
        </div>
      </div>
      
      {/* Filters toggle for mobile */}
      {isMobile && (
        <button 
          className="btn outline primary" 
          onClick={toggleFilters}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          {filtersOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      )}
      
      {/* Enhanced Filters */}
      {filtersOpen && (
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="status">Status:</label>
            <select 
              id="status" 
              value={statusFilter} 
              onChange={handleStatusChange}
            >
              <option value="">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="pending">Pending Verification</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="city">City:</label>
            <select 
              id="city" 
              value={cityFilter} 
              onChange={handleCityChange}
            >
              <option value="">All Cities</option>
              {cities.map((city, index) => (
                <option key={index} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div className="search-container">
            <Icons.Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search dealers..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <button className="btn outline primary" onClick={resetFilters}>
            <Icons.X size={isMobile ? 16 : 18} />
            Reset
          </button>
          
          <CSVLink 
            data={csvData} 
            filename="dealers-export.csv"
            className="btn outline primary"
          >
            <Icons.Download size={isMobile ? 16 : 18} />
            Export
          </CSVLink>
        </div>
      )}
      
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="dealers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Contact Number</th>
                  {!isMobile && <th>Alternate Number</th>}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDealers.length > 0 ? (
                  paginatedDealers.map((dealer) => (
                    <tr key={dealer.id}>
                      <td data-label="Name">{dealer.name}</td>
                      <td data-label="City">{dealer.city}</td>
                      <td data-label="Contact Number">{formatPhoneNumber(dealer.contactNumber)}</td>
                      {!isMobile && <td data-label="Alternate Number">{dealer.alternateNumber ? formatPhoneNumber(dealer.alternateNumber) : '-'}</td>}
                      <td data-label="Status">
                        <span className={`status ${dealer.status || 'pending'}`}>
                          {dealer.status || 'Pending'}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="actions">
                          <Link to={`/edit/${dealer.id}`} className="btn primary btn-sm">
                            {isMobile ? 'Edit' : 'Edit Details'}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isMobile ? 5 : 6} style={{ textAlign: 'center', padding: '2rem' }}>
                      No dealers found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                &laquo;
              </button>
              
              {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                // Show pagination numbers intelligently
                let pageNum;
                if (totalPages <= (isMobile ? 3 : 5)) {
                  // Show all pages if fewer than limit
                  pageNum = i + 1;
                } else if (currentPage <= (isMobile ? 2 : 3)) {
                  // Near the start
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - (isMobile ? 1 : 2)) {
                  // Near the end
                  pageNum = totalPages - (isMobile ? 2 : 4) + i;
                } else {
                  // In the middle
                  pageNum = currentPage - (isMobile ? 1 : 2) + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;