import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { formatDateDMY } from '../utils/dateUtils'
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

  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    nickname: '',
    email: '',
    address: '',
    notes: '',
  })

  useEffect(() => {
    fetchCustomers()
  }, [searchQuery, activeFilter, page])

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
    setFormData({
      fullName: '',
      mobileNumber: '',
      nickname: '',
      email: '',
      address: '',
      notes: '',
    })
    setShowAddModal(true)
  }

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer)
    setFormData({
      fullName: customer.fullName || '',
      mobileNumber: customer.mobileNumber || '',
      nickname: customer.nickname || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    })
    setShowEditModal(true)
  }

  const handleSaveCustomer = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (showEditModal && selectedCustomer) {
        await api.put(`/api/admin/customers/${selectedCustomer.id}`, formData)
        setSuccess('Customer updated successfully.')
        setShowEditModal(false)
      } else {
        await api.post('/api/admin/customers', formData)
        setSuccess('Customer registered successfully.')
        setShowAddModal(false)
      }
      fetchCustomers()
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.')
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
                <th>{t('customer.name')}</th>
                <th>{t('customer.mobile')}</th>
                <th>{t('customer.nickname')}</th>
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
                            alt={c.fullName}
                            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                            {c.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.fullName}</div>
                          {c.nickname && (
                            <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>({c.nickname})</span>
                            </div>
                          )}
                          {c.email && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{c.mobileNumber}</td>
                    <td>
                      {c.nickname ? (
                        <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9', fontWeight: 600, fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
                          {c.nickname}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
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
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('customer.name')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Ramesh Kumar / रमेश कुमार"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('customer.mobile')} *</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      placeholder="10-digit mobile number"
                      pattern="[0-9]{10,15}"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{t('customer.nickname')}</span>
                      <span style={{ fontSize: '0.72rem', color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                        Admin Assigned
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="e.g. Ramesh Bhai / रमेश भाई (Set by Admin)"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="optional@example.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('auth.address') || 'Address'}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House/Plot no., Street, Colony"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('customer.notes')}</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
