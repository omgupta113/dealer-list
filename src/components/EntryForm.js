import React, { useState } from 'react';
import { addDealer } from '../services/firebase';
import Papa from 'papaparse';
import { Save, Upload, AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const EntryForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    contactNumber: '',
    alternateNumber: '',
    status: ''
  });
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [importLoading, setImportLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation errors when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    const phoneRegex = /^\d{10}$/;
    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!phoneRegex.test(formData.contactNumber.replace(/\D/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid 10-digit phone number';
    }
    
    if (formData.alternateNumber && !phoneRegex.test(formData.alternateNumber.replace(/\D/g, ''))) {
      newErrors.alternateNumber = 'Please enter a valid 10-digit phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({
        text: 'Please correct the errors in the form',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format phone numbers consistently
      const formattedData = {
        ...formData,
        contactNumber: formData.contactNumber.replace(/\D/g, ''),
        alternateNumber: formData.alternateNumber ? formData.alternateNumber.replace(/\D/g, '') : ''
      };
      
      const result = await addDealer(formattedData);
      
      if (result.success) {
        setMessage({
          text: 'Dealer added successfully!',
          type: 'success'
        });
        
        // Reset form
        setFormData({
          name: '',
          city: '',
          contactNumber: '',
          alternateNumber: '',
          status: ''
        });
      } else {
        setMessage({
          text: 'Error adding dealer: ' + result.error,
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: 'Error adding dealer: ' + error.message,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      setFileName(file.name);
      setImportLoading(true);
      setMessage({ text: '', type: '' });
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;
            
            // Validate CSV structure
            const requiredHeaders = ['Name', 'City', 'Contact Number'];
            const headersPresent = requiredHeaders.every(header => 
              results.meta.fields.some(field => 
                field.toLowerCase() === header.toLowerCase() || 
                field.toLowerCase().replace(/\s/g, '') === header.toLowerCase().replace(/\s/g, '')
              )
            );
            
            if (!headersPresent) {
              setMessage({
                text: 'CSV file is missing required headers. Please ensure your file has: Name, City, and Contact Number columns.',
                type: 'error'
              });
              setImportLoading(false);
              return;
            }
            
            for (const row of results.data) {
              // Normalize column names
              const normalizedRow = {};
              Object.keys(row).forEach(key => {
                if (key.toLowerCase().includes('name') && !key.toLowerCase().includes('alternate')) {
                  normalizedRow.name = row[key];
                } else if (key.toLowerCase().includes('city')) {
                  normalizedRow.city = row[key];
                } else if (key.toLowerCase().includes('contact')) {
                  normalizedRow.contactNumber = row[key];
                } else if (key.toLowerCase().includes('alternate')) {
                  normalizedRow.alternateNumber = row[key];
                }
              });
              
              // Skip rows with missing required fields
              if (!normalizedRow.name || !normalizedRow.city || !normalizedRow.contactNumber) {
                skippedCount++;
                continue;
              }
              
              // Create dealer object from CSV row
              const dealer = {
                name: normalizedRow.name,
                city: normalizedRow.city,
                contactNumber: normalizedRow.contactNumber.replace(/\D/g, ''),
                alternateNumber: normalizedRow.alternateNumber ? normalizedRow.alternateNumber.replace(/\D/g, '') : '',
                status: ''  // Leave status blank as per requirement
              };
              
              // Add to database
              try {
                const result = await addDealer(dealer);
                if (result.success) {
                  successCount++;
                } else {
                  errorCount++;
                }
              } catch (error) {
                errorCount++;
              }
            }
            
            setMessage({
              text: `Import complete: ${successCount} dealers added, ${errorCount} errors, ${skippedCount} skipped due to missing data`,
              type: errorCount === 0 ? 'success' : skippedCount > 0 ? 'warning' : 'error'
            });
          } catch (error) {
            setMessage({
              text: 'Error importing CSV: ' + error.message,
              type: 'error'
            });
          } finally {
            setImportLoading(false);
            setFileName('');
            // Reset file input
            e.target.value = '';
          }
        },
        error: (error) => {
          setMessage({
            text: 'Error parsing CSV: ' + error.message,
            type: 'error'
          });
          setImportLoading(false);
          setFileName('');
          // Reset file input
          e.target.value = '';
        }
      });
    }
  };

  const clearMessage = () => {
    setMessage({ text: '', type: '' });
  };

  return (
    <div className="entry-form">
      <h1>Add New Dealer</h1>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' && <CheckCircle size={20} />}
          {message.type === 'error' && <AlertCircle size={20} />}
          {message.type === 'warning' && <Info size={20} />}
          {message.text}
          <button onClick={clearMessage} className="close-btn" aria-label="Close message">
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="Enter dealer name"
              />
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={errors.city ? 'error' : ''}
                placeholder="Enter city"
              />
              {errors.city && <div className="error-text">{errors.city}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number *</label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className={errors.contactNumber ? 'error' : ''}
                placeholder="Enter 10-digit number"
              />
              {errors.contactNumber && <div className="error-text">{errors.contactNumber}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="alternateNumber">Alternate Number</label>
              <input
                type="tel"
                id="alternateNumber"
                name="alternateNumber"
                value={formData.alternateNumber}
                onChange={handleChange}
                className={errors.alternateNumber ? 'error' : ''}
                placeholder="Optional alternate number"
              />
              {errors.alternateNumber && <div className="error-text">{errors.alternateNumber}</div>}
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn primary" 
            disabled={isSubmitting}
          >
            <Save size={18} />
            {isSubmitting ? 'Adding...' : 'Add Dealer'}
          </button>
        </form>
      </div>
      
      <div className="import-section form-container">
        <h2>Import from CSV</h2>
        <p>Upload a CSV file with headers: Name, City, Contact Number, Alternate Number</p>
        
        <div className="file-upload">
          <input
            type="file"
            id="csvFile"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={importLoading}
          />
          <label htmlFor="csvFile" className="btn secondary">
            <Upload size={18} />
            {importLoading ? 'Importing...' : 'Choose CSV File'}
          </label>
          {fileName && <span className="file-name">{fileName}</span>}
        </div>
        
        <div className="csv-sample" style={{ marginTop: '1rem' }}>
          <h3>Sample CSV Format</h3>
          <div className="table-container" style={{ maxWidth: '600px' }}>
            <table className="dealers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Contact Number</th>
                  <th>Alternate Number</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>John Smith</td>
                  <td>New Delhi</td>
                  <td>9876543210</td>
                  <td>9876543211</td>
                </tr>
                <tr>
                  <td>Priya Sharma</td>
                  <td>Mumbai</td>
                  <td>9876543212</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryForm;