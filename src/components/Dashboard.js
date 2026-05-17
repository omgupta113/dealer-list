import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getFilteredDealers, getDealers } from '../services/firebase'; // Import getDealers too
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

  // Separate function to calculate summary from ALL dealers
  const calculateSummary = useCallback(async () => {
    try {
      // Always get ALL dealers for summary calculation
      const allDealers = await getDealers();
      
      const verified = allDealers.filter(dealer => dealer.status === 'verified').length;
      const unverified = allDealers.filter(dealer => dealer.status === 'unverified').length;
      const pending = allDealers.filter(dealer => !dealer.status || dealer.status === '').length;
      
      setSummaryData({
        totalDealers: allDealers.length,
        verifiedDealers: verified,
        unverifiedDealers: unverified,
        pendingVerification: pending,
      });
      
      // Extract unique cities for filter dropdown from all dealers
      if (allDealers.length > 0) {
        const uniqueCities = [...new Set(allDealers.map(dealer => dealer.city))].sort();
        setCities(uniqueCities);
      }
    } catch (error) {
      console.error("Error calculating summary:", error);
    }
  }, []);

  // Function to fetch filtered dealers for display
  const fetchDealers = useCallback(async () => {
    setLoading(true);
    try {
      // Handle status filter mapping
      let statusParam = statusFilter;
      if (statusFilter === 'pending') {
        statusParam = 'blank';
      }
      
      console.log('Filtering with:', { status: statusParam, city: cityFilter }); // Debug log
      
      const dealersData = await getFilteredDealers(
        statusParam || null,
        cityFilter || null
      );
      
      console.log('Filtered dealers received:', dealersData.length); // Debug log
      setDealers(dealersData);
    } catch (error) {
      console.error("Error fetching dealers:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cityFilter]);

  // Calculate summary on component mount and when needed
  useEffect(() => {
    calculateSummary();
  }, []); // Only run once on mount

  // Fetch filtered dealers when filters change
  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

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
      
      {/* Summary Cards - always show totals from ALL dealers */}
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
      
      {/* Show current filter status */}
      {(statusFilter || cityFilter) && (
        <div className="filter-status" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <small>
            Showing: {filteredDealers.length} dealers
            {statusFilter && ` with status "${statusFilter === 'pending' ? 'Pending Verification' : statusFilter}"`}
            {cityFilter && ` in "${cityFilter}"`}
          </small>
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
                      {statusFilter || cityFilter || searchTerm ? 
                        'No dealers found matching your filters' : 
                        'No dealers found'
                      }
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