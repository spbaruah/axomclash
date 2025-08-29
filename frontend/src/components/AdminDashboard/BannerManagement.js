import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaUpload, FaArrowsAlt } from 'react-icons/fa';
import './BannerManagement.css';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cta_text: '',
    cta_link: '',
    display_order: 0,
    is_active: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/banners/admin', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setBanners(response.data.banners);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      cta_text: '',
      cta_link: '',
      display_order: 0,
      is_active: true
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setEditingBanner(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      if (editingBanner) {
        await axios.put(`/api/banners/${editingBanner.id}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Banner updated successfully!');
      } else {
        await axios.post('/api/banners', formDataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Banner created successfully!');
      }

      fetchBanners();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      description: banner.description || '',
      cta_text: banner.cta_text || '',
      cta_link: banner.cta_link || '',
      display_order: banner.display_order || 0,
      is_active: banner.is_active
    });
    setPreviewUrl(banner.image_url || '');
    setShowForm(true);
  };

  const handleDelete = async (bannerId) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await axios.delete(`/api/banners/${bannerId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        toast.success('Banner deleted successfully!');
        fetchBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
        toast.error('Failed to delete banner');
      }
    }
  };

  const handleToggleStatus = async (bannerId) => {
    try {
      await axios.patch(`/api/banners/${bannerId}/toggle`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      toast.success('Banner status updated!');
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner status:', error);
      toast.error('Failed to update banner status');
    }
  };

  const handleReorder = async (bannerId, newOrder) => {
    try {
      const bannerOrders = banners.map(banner => ({
        id: banner.id,
        display_order: banner.id === bannerId ? newOrder : banner.display_order
      }));

      await axios.post('/api/banners/reorder', { bannerOrders }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      fetchBanners();
    } catch (error) {
      console.error('Error reordering banners:', error);
      toast.error('Failed to reorder banners');
    }
  };

  if (loading) {
    return (
      <div className="banner-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading banners...</p>
      </div>
    );
  }

  return (
    <div className="banner-management">
      <div className="banner-header">
        <h2>Banner Management</h2>
        <button 
          className="add-banner-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <FaPlus /> Add New Banner
        </button>
      </div>

      {/* Banner Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="banner-form-container"
        >
          <form onSubmit={handleSubmit} className="banner-form">
            <div className="form-header">
              <h3>{editingBanner ? 'Edit Banner' : 'Create New Banner'}</h3>
              <button 
                type="button" 
                className="close-btn"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Banner title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Banner description"
                  rows="3"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>CTA Text</label>
                <input
                  type="text"
                  name="cta_text"
                  value={formData.cta_text}
                  onChange={handleInputChange}
                  placeholder="Call to action text"
                />
              </div>
              <div className="form-group">
                <label>CTA Link</label>
                <input
                  type="url"
                  name="cta_link"
                  value={formData.cta_link}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Banner Image</label>
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  required={!editingBanner}
                />
                <div className="upload-placeholder">
                  <FaUpload />
                  <span>Choose an image file</span>
                </div>
              </div>
              {previewUrl && (
                <div className="image-preview">
                  <img src={previewUrl} alt="Preview" />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                {editingBanner ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Banners List */}
      <div className="banners-list">
        {banners.length === 0 ? (
          <div className="no-banners">
            <p>No banners created yet. Create your first banner to get started!</p>
          </div>
        ) : (
          banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`banner-item ${!banner.is_active ? 'inactive' : ''}`}
            >
              <div className="banner-image">
                <img src={banner.image_url} alt={banner.title} />
                <div className="banner-overlay">
                  <div className="banner-info">
                    <h4>{banner.title}</h4>
                    <p>{banner.description}</p>
                    {banner.cta_text && (
                      <span className="cta-text">{banner.cta_text}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="banner-details">
                <div className="banner-meta">
                  <span className="order-badge">Order: {banner.display_order}</span>
                  <span className={`status-badge ${banner.is_active ? 'active' : 'inactive'}`}>
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="banner-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(banner)}
                    title="Edit Banner"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn toggle-btn"
                    onClick={() => handleToggleStatus(banner.id)}
                    title={banner.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {banner.is_active ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(banner.id)}
                    title="Delete Banner"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="banner-order-controls">
                <button
                  className="order-btn"
                  onClick={() => handleReorder(banner.id, Math.max(0, banner.display_order - 1))}
                  disabled={banner.display_order === 0}
                >
                  ↑
                </button>
                <button
                  className="order-btn"
                  onClick={() => handleReorder(banner.id, banner.display_order + 1)}
                >
                  ↓
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default BannerManagement;
