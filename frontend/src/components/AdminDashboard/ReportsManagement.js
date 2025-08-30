import React, { useState, useEffect } from 'react';
import './ReportsManagement.css';
import adminApi from '../../services/adminAxios';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await adminApi.get('/api/admin/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportAction = async (reportId, action, status, adminNotes = '') => {
    setActionLoading(true);
    try {
      const response = await adminApi.put(`/api/admin/reports/${reportId}`, {
        status,
        adminNotes,
        action
      });

      // Refresh reports
      await fetchReports();
      setShowReportModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePost = async (postId) => {
    setActionLoading(true);
    try {
      await adminApi.delete(`/api/admin/posts/${postId}`);

      // Refresh reports
      await fetchReports();
      setShowReportModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error removing post:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openReportModal = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pending', class: 'status-pending' },
      reviewed: { text: 'Reviewed', class: 'status-reviewed' },
      resolved: { text: 'Resolved', class: 'status-resolved' },
      dismissed: { text: 'Dismissed', class: 'status-dismissed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getReasonLabel = (reason) => {
    const reasonLabels = {
      spam: 'Spam',
      inappropriate: 'Inappropriate Content',
      harassment: 'Harassment',
      violence: 'Violence',
      fake_news: 'Fake News',
      other: 'Other'
    };
    return reasonLabels[reason] || reason;
  };

  if (isLoading) {
    return (
      <div className="reports-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports-management">
      <div className="management-header">
        <h2>Reports Management</h2>
        <p>Review and manage reported posts from users</p>
      </div>

      <div className="reports-stats">
        <div className="stat-card">
          <div className="stat-number">{reports.filter(r => r.status === 'pending').length}</div>
          <div className="stat-label">Pending Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{reports.filter(r => r.status === 'resolved').length}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{reports.filter(r => r.status === 'dismissed').length}</div>
          <div className="stat-label">Dismissed</div>
        </div>
      </div>

      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="no-reports">
            <div className="no-reports-icon">📋</div>
            <h3>No Reports Found</h3>
            <p>All reported posts have been reviewed and resolved.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="report-item">
              <div className="report-header">
                <div className="report-info">
                  <span className="report-reason">{getReasonLabel(report.reason)}</span>
                  {getStatusBadge(report.status)}
                  <span className="report-date">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  className="view-report-btn"
                  onClick={() => openReportModal(report)}
                >
                  👁️ View Details
                </button>
              </div>
              
              <div className="report-content">
                <div className="post-preview">
                  <p><strong>Post Author:</strong> {report.postAuthor.fullName} (@{report.postAuthor.username})</p>
                  <p><strong>College:</strong> {report.college}</p>
                  <p><strong>Content:</strong> {report.post.content.substring(0, 100)}...</p>
                  <p><strong>Report Count:</strong> {report.post.reportCount}</p>
                </div>
                
                <div className="reporter-info">
                  <p><strong>Reported by:</strong> {report.reporter.fullName} (@{report.reporter.username})</p>
                  {report.description && (
                    <p><strong>Description:</strong> {report.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Detail Modal */}
      {showReportModal && selectedReport && (
        <div className="modal-overlay" onClick={closeReportModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Details</h3>
              <button className="close-btn" onClick={closeReportModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="report-details">
                <div className="detail-section">
                  <h4>Report Information</h4>
                  <p><strong>Reason:</strong> {getReasonLabel(selectedReport.reason)}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedReport.status)}</p>
                  <p><strong>Reported on:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
                  {selectedReport.description && (
                    <p><strong>Description:</strong> {selectedReport.description}</p>
                  )}
                </div>

                <div className="detail-section">
                  <h4>Post Details</h4>
                  <p><strong>Author:</strong> {selectedReport.postAuthor.fullName} (@{selectedReport.postAuthor.username})</p>
                  <p><strong>College:</strong> {selectedReport.college}</p>
                  <p><strong>Type:</strong> {selectedReport.post.type}</p>
                  <p><strong>Content:</strong> {selectedReport.post.content}</p>
                  <p><strong>Report Count:</strong> {selectedReport.post.reportCount}</p>
                  <p><strong>Status:</strong> {selectedReport.post.isActive ? 'Active' : 'Removed'}</p>
                </div>

                {selectedReport.post.mediaUrls && selectedReport.post.mediaUrls.length > 0 && (
                  <div className="detail-section">
                    <h4>Media</h4>
                    <div className="media-preview">
                      {selectedReport.post.mediaUrls.map((url, index) => (
                        <div key={index} className="media-item">
                          {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <img src={url} alt={`Media ${index + 1}`} />
                          ) : (
                            <video controls>
                              <source src={url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Reporter Information</h4>
                  <p><strong>Name:</strong> {selectedReport.reporter.fullName}</p>
                  <p><strong>Username:</strong> @{selectedReport.reporter.username}</p>
                </div>
              </div>

              {selectedReport.status === 'pending' && (
                <div className="action-section">
                  <h4>Actions</h4>
                  <div className="action-buttons">
                    <button 
                      className="action-btn dismiss"
                      onClick={() => handleReportAction(selectedReport.id, 'dismiss', 'dismissed', 'Report dismissed by admin')}
                      disabled={actionLoading}
                    >
                      Dismiss Report
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => handleRemovePost(selectedReport.postId)}
                      disabled={actionLoading}
                    >
                      Remove Post
                    </button>
                    <button 
                      className="action-btn resolve"
                      onClick={() => handleReportAction(selectedReport.id, 'resolve', 'resolved', 'Report resolved by admin')}
                      disabled={actionLoading}
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;
