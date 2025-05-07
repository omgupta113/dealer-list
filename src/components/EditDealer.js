import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDealerById, updateDealer, deleteDealer } from '../services/firebase';
import { Save, Trash2, ArrowLeft, AlertCircle, CheckCircle, Info } from 'lucide-react';

const EditDealer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    contactNumber: '',
    alternateNumber: '',
    status: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchDealer = async () => {
      try {
        const dealer = await getDealerById(id);
        if (dealer) {
          setFormData({
            name: dealer.name || '',
            city: dealer.city || '',
            contactNumber: dealer.contactNumber || '',
            alternateNumber: dealer.alternateNumber || '',
            status: dealer.status || ''
          });
        } else {
          setMessage({
            text: 'Dealer not found',
            type: 'error'
          });
        }
      } catch (error) {
        setMessage({
          text: 'Error loading dealer: ' + error.message,
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDealer();
  }, [id]);

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
      
      const result = await updateDealer(id, formattedData);
      
      if (result.success) {
        setMessage({
          text: 'Dealer updated successfully!',
          type: 'success'
        });
        
        // Redirect back to dashboard after short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage({
          text: 'Error updating dealer: ' + result.error,
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: 'Error updating dealer: ' + error.message,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await deleteDealer(id);
      
      if (result.success) {
        setMessage({
          text: 'Dealer deleted successfully!',
          type: 'success'
        });
        
        // Redirect back to dashboard after short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage({
          text: 'Error deleting dealer: ' + result.error,
          type: 'error'
        });
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      setMessage({
        text: 'Error deleting dealer: ' + error.message,
        type: 'error'
      });
      setShowDeleteConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMessage = () => {
    setMessage({ text: '', type: '' });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="edit-dealer-form">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <button 
          className="btn outline primary" 
          onClick={() => navigate(-1)}
          style={{ marginRight: '1rem' }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <h1>Edit Dealer</h1>
      </div>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' && <CheckCircle size={20} />}
          {message.type === 'error' && <AlertCircle size={20} />}
          {message.type === 'warning' && <Info size={20} />}
          {message.text}
          <button onClick={clearMessage} className="close-btn" aria-label="Close message">
            <Trash2 size={16} />
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
          
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              className="btn primary" 
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            
            {!showDeleteConfirm ? (
              <button 
                type="button" 
                className="btn danger" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                <Trash2 size={18} />
                Delete Dealer
              </button>
            ) : (
              <div className="confirm-delete" style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ marginRight: '0.5rem', alignSelf: 'center' }}>Are you sure?</span>
                <button 
                  type="button" 
                  className="btn danger" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button 
                  type="button" 
                  className="btn secondary" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDealer;