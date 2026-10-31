import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { formatDateDMY } from '../utils/dateUtils'
import { saveDraft, getDraft, clearDraft, queueOfflineAction } from '../utils/draftStorage'
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Camera,
  AlertCircle,
  X,
  FileText,
  Calendar,
  MessageSquare,
  UserCheck,
  Clock,
  ShieldAlert,
} from 'lucide-react'

export default function CustomerManagement() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [draftRestored, setDraftRestored] = useState(false)

  // Pending Registration Approval State
  const [activeTab, setActiveTab] = useState('customers') // 'customers' or 'approvals'
  const [pendingRequests, setPendingRequests] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [approveAdminName, setApproveAdminName] = useState('')
  const [approvalLoading, setApprovalLoading] = useState(false)

  const [formData, setFormData] = useState({
    nameByAdmin: '',
    nameByCustomer: '',
    fullName: '',
    mobileNumber: '',
    nickname: '',
    email: '',
    address: '',
    notes: '',
  })

  // Synchronize form fields with draft in localStorage
  const updateFormField = (field, val) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val }
      if (field === 'nameByAdmin') {
        next.fullName = val
      }
      const draftKey = showEditModal && selectedCustomer ? `customer_edit_${selectedCustomer.id}` : 'customer_add'
      saveDraft(draftKey, next)
      return next
    })
  }

  useEffect(() => {
    fetchCustomers()
    fetchPendingRequests()
  }, [searchQuery, activeFilter, page])

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/api/admin/registrations/pending')
      setPendingRequests(res.data || [])
      setPendingCount((res.data || []).length)
    } catch (e) {
      console.warn('Failed to load pending registrations:', e)
    }
  }

  const handleOpenApproveModal = (req) => {
    setSelectedRequest(req)
    setApproveAdminName(req.fullName || '')
    setShowApproveModal(true)
  }

  const handleConfirmApprove = async () => {
    if (!selectedRequest) return
    setApprovalLoading(true)
    setError('')
    try {
      await api.post(`/api/admin/registrations/${selectedRequest.id}/approve`, {
        nameByAdmin: approveAdminName.trim()
      })
      setSuccess(`✅ Successfully approved ${selectedRequest.fullName}! Welcome credentials and login link sent via TextBee SMS.`)
      setShowApproveModal(false)
      setSelectedRequest(null)
      fetchPendingRequests()
      fetchCustomers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve registration.')
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleRejectRequest = async (req) => {
    if (!window.confirm(`Are you sure you want to reject the registration request for ${req.fullName} (${req.mobileNumber})?`)) return
    try {
      await api.post(`/api/admin/registrations/${req.id}/reject`, { reason: 'Rejected by admin' })
      setSuccess(`Registration request for ${req.fullName} has been rejected.`)
      fetchPendingRequests()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject registration.')
    }
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/admin/customers', {
        params: {
          query: searchQuery,
          active: activeFilter,
          page,
          size: 10,
        },
      })
      setCustomers(res.data.content || [])
      setTotalPages(res.data.totalPages || 0)
    } catch (err) {
      setError('Failed to fetch customers.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    const saved = getDraft('customer_add')
    if (saved && (saved.nameByAdmin || saved.mobileNumber || saved.email)) {
      setFormData(saved)
      setDraftRestored(true)
    } else {
      setFormData({
        nameByAdmin: '',
        nameByCustomer: '',
        fullName: '',
        mobileNumber: '',
        nickname: '',
        email: '',
        address: '',
        notes: '',
      })
      setDraftRestored(false)
    }
    setShowAddModal(true)
  }

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer)
    const draftKey = `customer_edit_${customer.id}`
    const saved = getDraft(draftKey)
    if (saved && (saved.nameByAdmin || saved.mobileNumber)) {
      setFormData(saved)
      setDraftRestored(true)
    } else {
      setFormData({
        nameByAdmin: customer.nameByAdmin || customer.fullName || '',
        nameByCustomer: customer.nameByCustomer || customer.fullName || '',
        fullName: customer.fullName || customer.nameByAdmin || '',
        mobileNumber: customer.mobileNumber || '',
        nickname: customer.nickname || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || '',
      })
      setDraftRestored(false)
    }
    setShowEditModal(true)
  }

  const handleSaveCustomer = async (e) => {
    e.preventDefault()
    setError('')
    const draftKey = showEditModal && selectedCustomer ? `customer_edit_${selectedCustomer.id}` : 'customer_add'

    try {
      const payload = {
        ...formData,
        fullName: formData.nameByAdmin || formData.fullName,
      }
      if (showEditModal && selectedCustomer) {
        await api.put(`/api/admin/customers/${selectedCustomer.id}`, payload)
        setSuccess('Customer updated successfully.')
        clearDraft(draftKey)
        setShowEditModal(false)
      } else {
        await api.post('/api/admin/customers', payload)
        setSuccess('Customer registered successfully. Login credentials sent via SMS!')
        clearDraft(draftKey)
        setShowAddModal(false)
      }
      fetchCustomers()
    } catch (err) {
      // Keep saved in draft so user won't lose entered details
      saveDraft(draftKey, formData)
      const isServerDown = !err.response || err.response.status >= 500
      if (isServerDown) {
        queueOfflineAction({
          action: showEditModal ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER',
          endpoint: showEditModal ? `/api/admin/customers/${selectedCustomer.id}` : '/api/admin/customers',
          method: showEditModal ? 'PUT' : 'POST',
          payload: { ...formData, fullName: formData.nameByAdmin || formData.fullName },
          description: `Customer: ${formData.nameByAdmin}`,
        })
        setError('Backend server is unreachable! Your entered data has been securely saved to local storage draft so you do not have to type it again. You can retry once the server is back.')
      } else {
        setError(err.response?.data?.message || 'Operation failed. Your entered details remain saved in local draft.')
      }
    }
  }

  const handleToggleActive = async (customer) => {
    setError('')
    try {
      if (customer.active) {
        if (!window.confirm(t('customer.confirmDeactivate'))) return
        await api.patch(`/api/admin/customers/${customer.id}/deactivate`)
        setSuccess(`Deactivated ${customer.customerNumber}`)
      } else {
        await api.patch(`/api/admin/customers/${customer.id}/activate`)
        setSuccess(`Activated ${customer.customerNumber}`)
      }
      fetchCustomers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update customer status.')
    }
  }

  const handleDelete = async (customer) => {
    if (!window.confirm(t('customer.confirmDelete'))) return
    setError('')
    try {
      await api.delete(`/api/admin/customers/${customer.id}`)
      setSuccess(`Deleted customer ${customer.customerNumber}`)
      fetchCustomers()
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot delete customer with history.')
    }
  }

  const handleUploadPhoto = async (e) => {
    e.preventDefault()
    if (!photoFile || !selectedCustomer) return
    setError('')
    const uploadData = new FormData()
    uploadData.append('file', photoFile)

    try {
      await api.post(`/api/admin/customers/${selectedCustomer.id}/photo`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess('Profile image uploaded successfully.')
      setShowPhotoModal(false)
      setPhotoFile(null)
      fetchCustomers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo.')
    }
  }

  const handleSendSms = async (customer) => {
    try {
      setError('')
      setSuccess('')
      const res = await api.post(`/api/admin/customers/${customer.id}/send-welcome-sms`)
      if (res.data?.success) {
        setSuccess(`SMS with login credentials queued/sent to ${customer.mobileNumber} via TextBee.`)
      } else {
        setError(`Failed to send SMS to ${customer.mobileNumber}. Please check TextBee gateway.`)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send SMS.')
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>{t('nav.customers')}</h2>
          <p className="card-subtitle">Manage customer registry, delivery assignments, and accounts</p>
        </div>
        <div className="page-header-actions">
          <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
            <UserPlus size={16} />
            <span>{t('customer.addCustomer')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Navigation Tabs: Customers vs Pending Approvals */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'customers' ? '3px solid var(--color-primary)' : '3px solid transparent',
            padding: '0.5rem 1rem',
            fontWeight: activeTab === 'customers' ? 700 : 500,
            color: activeTab === 'customers' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem',
          }}
        >
          <Users size={18} />
          <span>Customer Directory</span>
          <span className="badge badge-blue">{customers.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'approvals' ? '3px solid #ea580c' : '3px solid transparent',
            padding: '0.5rem 1rem',
            fontWeight: activeTab === 'approvals' ? 700 : 500,
            color: activeTab === 'approvals' ? '#ea580c' : 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem',
          }}
        >
          <Clock size={18} />
          <span>Pending Approvals</span>
          {pendingCount > 0 ? (
            <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
              {pendingCount}
            </span>
          ) : (
            <span className="badge badge-secondary">0</span>
          )}
        </button>
      </div>

      {activeTab === 'customers' ? (
        <>
          {/* Filter and Search Bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', minWidth: 'min(100%, 240px)', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-light)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px' }}
              placeholder={t('customer.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === null ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveFilter(null); setPage(0); }}
            >
              All Status
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === true ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveFilter(true); setPage(0); }}
            >
              {t('customer.active')}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeFilter === false ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveFilter(false); setPage(0); }}
            >
              {t('customer.inactive')}
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('customer.customerNumber')}</th>
                <th>Admin Register Name (nameByAdmin)</th>
                <th>Customer App Name (nameByCustomer)</th>
                <th>{t('customer.mobile')}</th>
                <th>{t('customer.balance')}</th>
                <th>{t('customer.status')}</th>
                <th>{t('customer.registeredOn')}</th>
                <th style={{ textAlign: 'right' }}>{t('customer.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>{t('common.loading')}</td></tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="badge badge-blue" style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>
                        {c.customerNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {c.profileImageUrl ? (
                          <img
                            src={c.profileImageUrl}
                            alt={c.nameByAdmin || c.fullName}
                            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                            {(c.nameByAdmin || c.fullName || 'C').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                            {c.nameByAdminHindi && c.nameByAdminEnglish
                              ? `${c.nameByAdminHindi} (${c.nameByAdminEnglish})`
                              : (c.nameByAdmin || c.fullName)}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#0369a1', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            Admin Register Key (Hindi &amp; English)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.nameByCustomer || c.fullName}</div>
                        {c.nickname && (
                          <div style={{ fontSize: '0.75rem', color: '#6366f1' }}>
                            Alias: {c.nickname}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{c.mobileNumber}</td>
                    <td style={{ fontWeight: 600, color: (c.currentBalance > 0) ? '#dc2626' : '#16a34a' }}>
                      ₹{Number(c.currentBalance || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={c.active ? 'badge badge-success' : 'badge badge-danger'}>
                        {c.active ? t('customer.active') : t('customer.inactive')}
                      </span>
                    </td>
                    <td>{formatDateDMY(c.registrationDate)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSendSms(c)}
                          title="Send Credentials SMS (TextBee)"
                          style={{ color: '#0284c7' }}
                        >
                          <MessageSquare size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setSelectedCustomer(c); setShowPhotoModal(true); }}
                          title={t('customer.uploadPhoto')}
                        >
                          <Camera size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(c)}
                          title={t('customer.editCustomer')}
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${c.active ? 'btn-secondary' : 'btn-success'}`}
                          onClick={() => handleToggleActive(c)}
                          title={c.active ? t('customer.deactivate') : t('customer.activate')}
                        >
                          {c.active ? <XCircle size={14} color="#ea580c" /> : <CheckCircle size={14} />}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDelete(c)}
                          title={t('customer.delete')}
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    {t('common.noRecords')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        /* Pending Registrations Tab View */
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="#ea580c" />
                <span>Pending Customer Registrations</span>
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Review and approve new self-registered customers. Approving will create the account and send an SMS with login details via TextBee.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchPendingRequests}
            >
              Refresh Requests
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Mobile Number</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Requested On</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests && pendingRequests.length > 0 ? (
                  pendingRequests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                          {req.fullName}
                        </div>
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                          Awaiting Approval
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {req.mobileNumber}
                        </span>
                      </td>
                      <td>{req.email || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                      <td>{req.address || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                      <td>{formatDateDMY(req.createdAt ? req.createdAt.split('T')[0] : '')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={() => handleOpenApproveModal(req)}
                            title="Approve Customer & Send SMS"
                          >
                            <UserCheck size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleRejectRequest(req)}
                            title="Reject Request"
                            style={{ color: '#dc2626' }}
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                      🎉 No pending customer registration requests! All submissions have been approved.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Registration Modal */}
      {showApproveModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Approve Customer Registration</h3>
              <button
                type="button"
                onClick={() => { setShowApproveModal(false); setSelectedRequest(null); }}
                className="btn btn-secondary btn-sm"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: 'var(--color-bg-muted)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <strong>Applicant:</strong> {selectedRequest.fullName}
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <strong>Mobile Number (Login ID):</strong> {selectedRequest.mobileNumber}
                </div>
                {selectedRequest.address && (
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>Address:</strong> {selectedRequest.address}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Admin Register Name (nameByAdmin) *</span>
                  <span style={{ fontSize: '0.72rem', color: '#0369a1', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    Register Unique Key
                  </span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={approveAdminName}
                  onChange={(e) => setApproveAdminName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar / रमेश कुमार"
                  required
                />
                <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                  Enter either in Hindi or English. The system will automatically transliterate and save both!
                </small>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.65rem 0.85rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '0.8rem', color: '#047857' }}>
                📲 <strong>Automatic SMS Dispatch:</strong> Upon approval, a welcome SMS containing login credentials and the website link will be sent to <strong>{selectedRequest.mobileNumber}</strong> via TextBee.
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowApproveModal(false); setSelectedRequest(null); }}
                disabled={approvalLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmApprove}
                disabled={approvalLoading || !approveAdminName.trim()}
              >
                <UserCheck size={16} />
                <span>{approvalLoading ? 'Approving & Sending SMS...' : 'Approve & Send SMS'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{showEditModal ? t('customer.editCustomer') : t('customer.addCustomer')}</h3>
              <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="btn btn-secondary btn-sm">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                {draftRestored && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#166534',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span>📝 <strong>Restored Draft:</strong> Unsaved customer details were restored from local storage.</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                      onClick={() => {
                        const draftKey = showEditModal && selectedCustomer ? `customer_edit_${selectedCustomer.id}` : 'customer_add'
                        clearDraft(draftKey)
                        setFormData({
                          nameByAdmin: '',
                          nameByCustomer: '',
                          fullName: '',
                          mobileNumber: '',
                          nickname: '',
                          email: '',
                          address: '',
                          notes: '',
                        })
                        setDraftRestored(false)
                      }}
                    >
                      Clear Draft
                    </button>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.6rem 0.85rem' }}>
                    <AlertCircle size={16} />
                    <span style={{ fontSize: '0.85rem' }}>{error}</span>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Admin Register Name (nameByAdmin) *</span>
                      <span style={{ fontSize: '0.72rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        Unique &bull; Only Admin
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nameByAdmin}
                      onChange={(e) => updateFormField('nameByAdmin', e.target.value)}
                      placeholder="e.g. गुप्ता / Gupta (Notebook Register Name)"
                      required
                    />
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      Enter either in Hindi (गुप्ता) or English (Gupta). The system will automatically convert and save both!
                    </small>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Customer App Name (nameByCustomer)</span>
                      <span style={{ fontSize: '0.72rem', color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                        Only Customer Can Edit
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nameByCustomer}
                      onChange={(e) => updateFormField('nameByCustomer', e.target.value)}
                      placeholder="e.g. Ramesh Gupta (Customer's own display name)"
                      disabled={showEditModal}
                      style={showEditModal ? { background: 'var(--color-bg-muted)', cursor: 'not-allowed' } : undefined}
                    />
                    {showEditModal && (
                      <small style={{ color: '#6366f1', fontSize: '0.75rem' }}>
                        Customer manages their own display name from the customer portal.
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('customer.mobile')} *</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.mobileNumber}
                      onChange={(e) => updateFormField('mobileNumber', e.target.value)}
                      placeholder="10-digit mobile number (used for customer login)"
                      pattern="[0-9]{10,15}"
                      required
                    />
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      Customer login username and initial password is set to their mobile number.
                    </small>
                    <div style={{ marginTop: '0.35rem', padding: '0.35rem 0.6rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', fontSize: '0.73rem', color: '#047857' }}>
                      📲 <strong>SMS Alert:</strong> Login credentials will be automatically sent to this number via SMS upon saving.
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('customer.nickname')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nickname}
                      onChange={(e) => updateFormField('nickname', e.target.value)}
                      placeholder="e.g. Ramesh Bhai (Admin alias)"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => updateFormField('email', e.target.value)}
                    placeholder="optional@example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('auth.address') || 'Address'}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => updateFormField('address', e.target.value)}
                    placeholder="House/Plot no., Street, Colony"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('customer.notes')}</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => updateFormField('notes', e.target.value)}
                    placeholder="Any specific delivery instructions or preferences"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                >
                  {t('customer.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('customer.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Photo Modal */}
      {showPhotoModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Upload Profile Photo</h3>
              <button type="button" onClick={() => setShowPhotoModal(false)} className="btn btn-secondary btn-sm">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUploadPhoto}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Upload photo for <strong>{selectedCustomer.customerNumber}</strong> ({selectedCustomer.fullName})
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPhotoModal(false)}>
                  {t('customer.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={!photoFile}>
                  Upload Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
