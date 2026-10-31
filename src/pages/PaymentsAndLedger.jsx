import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { formatDateDMY } from '../utils/dateUtils'
import { saveDraft, getDraft, clearDraft, queueOfflineAction } from '../utils/draftStorage'
import {
  CreditCard,
  PlusCircle,
  BookOpen,
  DollarSign,
  AlertCircle,
  CheckCircle,
  X,
  User,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react'

export default function PaymentsAndLedger() {
  const { t } = useTranslation()

  const [activeCustomers, setActiveCustomers] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerLedger, setCustomerLedger] = useState(null)
  const [paymentsList, setPaymentsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Payment Recording Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    referenceNumber: '',
    notes: '',
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerLedger(selectedCustomerId)
    }
  }, [selectedCustomerId])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const custRes = await api.get('/api/admin/customers/active')
      const customers = custRes.data || []
      setActiveCustomers(customers)
      if (customers.length > 0) {
        setSelectedCustomerId(customers[0].id)
      }

      const pmtRes = await api.get('/api/admin/payments', { params: { page: 0, size: 25 } })
      setPaymentsList(pmtRes.data.content || [])
    } catch (err) {
      setError('Failed to load payment records.')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerLedger = async (custId) => {
    try {
      const res = await api.get(`/api/admin/payments/customer/${custId}/ledger`)
      setCustomerLedger(res.data)
    } catch (err) {
      console.error('Failed to load ledger', err)
    }
  }

  const [draftRestored, setDraftRestored] = useState(false)

  const handleOpenPayment = (customerId = '') => {
    const saved = getDraft('payment_record_draft')
    if (saved && (saved.amount || saved.notes || saved.referenceNumber)) {
      setFormData({
        ...saved,
        customerId: customerId || saved.customerId || selectedCustomerId || '',
      })
      setDraftRestored(true)
    } else {
      setFormData({
        customerId: customerId || selectedCustomerId || '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI',
        referenceNumber: '',
        notes: '',
      })
      setDraftRestored(false)
    }
    setShowPaymentModal(true)
  }

  const handleSavePayment = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/admin/payments', {
        ...formData,
        amount: Number(formData.amount),
      })
      clearDraft('payment_record_draft')
      setDraftRestored(false)
      setSuccess('Payment recorded and allocated successfully.')
      setShowPaymentModal(false)
      fetchInitialData()
      if (formData.customerId) {
        fetchCustomerLedger(formData.customerId)
      }
    } catch (err) {
      saveDraft('payment_record_draft', formData)
      const isServerDown = !err.response || err.response.status >= 500
      if (isServerDown) {
        queueOfflineAction({
          action: 'RECORD_PAYMENT',
          endpoint: '/api/admin/payments',
          method: 'POST',
          payload: { ...formData, amount: Number(formData.amount) },
          description: `Payment of ₹${formData.amount} for customer ${formData.customerId}`,
        })
        setError('Backend is offline! Your payment details are safely stored in local draft so you do not have to fill them again.')
      } else {
        setError(err.response?.data?.message || 'Failed to record payment. Preserved in local draft.')
      }
    }
  }

  return (
    <div>
      {/* Title */}
      <div className="page-header">
        <div>
          <h2>{t('payment.title')}</h2>
          <p className="card-subtitle">{t('payment.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenPayment()}
          >
            <PlusCircle size={16} />
            <span>{t('payment.recordPayment')}</span>
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

      {/* Customer Selector & Summary Cards for Ledger */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Select Customer Ledger:</label>
          <select
            className="form-control"
            style={{ maxWidth: '350px' }}
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            {activeCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customerNumber} - {c.fullName}
              </option>
            ))}
          </select>

          {selectedCustomerId && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleOpenPayment(selectedCustomerId)}
            >
              + Collect Payment For This Customer
            </button>
          )}
        </div>

        {customerLedger && (
          <div className="grid-cols-3">
            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Total Billed</span>
                <span className="stat-value">₹{Number(customerLedger.totalBilled || 0).toFixed(2)}</span>
                <span className="stat-sub">All monthly invoices</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Total Payments Received</span>
                <span className="stat-value" style={{ color: '#16a34a' }}>
                  ₹{Number(customerLedger.totalPaid || 0).toFixed(2)}
                </span>
                <span className="stat-sub">Cleared collections</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Outstanding Balance</span>
                <span className="stat-value" style={{ color: customerLedger.outstandingBalance > 0 ? '#dc2626' : '#16a34a' }}>
                  ₹{Number(customerLedger.outstandingBalance || 0).toFixed(2)}
                </span>
                <span className="stat-sub">Net closing balance due</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Ledger Table */}
      <div className="card" style={{ padding: 0, marginBottom: '2rem' }}>
        <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', margin: 0 }}>
          <div>
            <h3>{t('payment.ledgerTitle')}</h3>
            <p className="card-subtitle">
              Chronological passbook transactions for <strong>{customerLedger?.customerNumber}</strong> ({customerLedger?.customerName})
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>Type</th>
                <th>Reference #</th>
                <th>Description</th>
                <th style={{ textAlign: 'right', color: '#dc2626' }}>{t('payment.debit')} (+)</th>
                <th style={{ textAlign: 'right', color: '#16a34a' }}>{t('payment.credit')} (-)</th>
                <th style={{ textAlign: 'right' }}>{t('payment.balance')}</th>
              </tr>
            </thead>
            <tbody>
              {customerLedger?.entries && customerLedger.entries.length > 0 ? (
                customerLedger.entries.map((entry, idx) => (
                  <tr key={idx}>
                    <td>{formatDateDMY(entry.date)}</td>
                    <td>
                      <span className={entry.type === 'INVOICE' ? 'badge badge-blue' : entry.type === 'PAYMENT' ? 'badge badge-success' : 'badge badge-warning'}>
                        {entry.type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{entry.reference}</td>
                    <td>{entry.description}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: entry.debit > 0 ? '#dc2626' : 'var(--color-text-light)' }}>
                      {entry.debit > 0 ? `₹${Number(entry.debit).toFixed(2)}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: entry.credit > 0 ? '#16a34a' : 'var(--color-text-light)' }}>
                      {entry.credit > 0 ? `₹${Number(entry.credit).toFixed(2)}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      ₹{Number(entry.runningBalance).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No ledger transactions recorded for this customer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{t('payment.recordPayment')}</h3>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary btn-sm">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSavePayment}>
              <div className="modal-body">
                {draftRestored && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#166534',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span>📝 Restored unsaved payment draft from local storage.</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}
                      onClick={() => {
                        clearDraft('payment_record_draft')
                        setFormData({
                          customerId: selectedCustomerId || '',
                          amount: '',
                          paymentDate: new Date().toISOString().split('T')[0],
                          paymentMethod: 'UPI',
                          referenceNumber: '',
                          notes: '',
                        })
                        setDraftRestored(false)
                      }}
                    >
                      Clear Draft
                    </button>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">{t('invoice.selectCustomer')} *</label>
                  <select
                    className="form-control"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {activeCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerNumber} - {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('payment.amount')} *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="form-control"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('payment.paymentDate')} *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('payment.method')} *</label>
                    <select
                      className="form-control"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('payment.referenceNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      placeholder="e.g. UTR / Receipt / Cheque #"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('payment.notes')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional remarks"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  {t('customer.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('payment.savePayment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
