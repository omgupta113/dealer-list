// src/utils/responsiveTables.js
/**
 * Make tables responsive by adding data-label attributes to each cell
 * based on the corresponding header
 */
export const initResponsiveTables = () => {
    const tables = document.querySelectorAll('.dealers-table');
    
    tables.forEach(table => {
      // Get all headers
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent);
      
      // For each row in the table body
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        // Get all cells in the row
        const cells = row.querySelectorAll('td');
        
        // For each cell, add a data-label attribute with the corresponding header text
        cells.forEach((cell, index) => {
          if (headers[index]) {
            cell.setAttribute('data-label', headers[index]);
          }
        });
      });
    });
  };
  
  // Add window resize event listener to handle orientation changes
  export const setupResizeListener = () => {
    let timeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(timeout);
      
      // Debounce the resize event
      timeout = setTimeout(() => {
        initResponsiveTables();
      }, 250);
    });
  };
  
  // Call this when the app initializes
  export const setupResponsiveTables = () => {
    // Initial setup
    initResponsiveTables();
    
    // Setup resize listener
    setupResizeListener();
    
    // Also rerun when DOM content is loaded to catch any dynamically created tables
    document.addEventListener('DOMContentLoaded', initResponsiveTables);
    
    // Create a mutation observer to watch for table changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && 
            (mutation.target.classList.contains('table-container') || 
             mutation.target.classList.contains('dealers-table'))) {
          setTimeout(initResponsiveTables, 100);
          break;
        }
      }
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
  };