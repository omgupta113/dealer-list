// Simple CSV export utility to replace react-csv

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert to CSV
 * @returns {string} CSV formatted string
 */
export const convertToCSV = (data) => {
    if (!data || data.length === 0) {
      return '';
    }
    
    // Get headers from first row
    const headers = Object.keys(data[0]);
    
    // Create CSV rows
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and handle commas
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };
  
  /**
   * Download data as a CSV file
   * @param {Array} data - Array of objects to download as CSV
   * @param {string} filename - Name of the file to download
   */
  export const downloadCSV = (data, filename = 'export.csv') => {
    if (!data || data.length === 0) {
      console.error('No data to export');
      return;
    }
    
    const csvString = convertToCSV(data);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    
    // Create object URL
    const url = URL.createObjectURL(blob);
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Add to document
    document.body.appendChild(link);
    
    // Click link to download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  /**
   * CSV Link Component - replaces react-csv's CSVLink
   * @param {Object} props - Component props
   * @returns {React.Component} CSV download link
   */
  export const CSVLink = ({ data, filename, children, className, ...props }) => {
    const handleClick = (e) => {
      e.preventDefault();
      downloadCSV(data, filename);
    };
    
    return (
      <button 
        onClick={handleClick}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  };