import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import {
  FileText,
  FileCheck2,
  Download,
  Printer,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
  Play,
  Layers,
} from 'lucide-react'

export default function InvoiceManagement() {
  const { t, i18n } = useTranslation()

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [invoices, setInvoices] = useState([])
  const [activeCustomers, setActiveCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Single Generate / Preview Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [adjustments, setAdjustments] = useState('0.00')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [previewInvoice, setPreviewInvoice] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    fetchInvoices()
    fetchActiveCustomers()
  }, [selectedYear, selectedMonth])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/admin/invoices', {
        params: {
          year: selectedYear,
          month: selectedMonth,
          page: 0,
          size: 50,
        },
      })
      setInvoices(res.data.content || [])
    } catch (err) {
      setError('Failed to fetch invoices.')
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveCustomers = async () => {
    try {
      const res = await api.get('/api/admin/customers/active')
      setActiveCustomers(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handlePreview = async () => {
    if (!selectedCustomerId) {
      setError('Please select a customer first.')
      return
    }
    setPreviewLoading(true)
    setError('')
    try {
      const res = await api.post('/api/admin/invoices/preview', {
        customerId: selectedCustomerId,
        year: selectedYear,
        month: selectedMonth,
        adjustments: Number(adjustments) || 0,
        adjustmentReason,
      })
      setPreviewInvoice(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to preview invoice.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleFinalize = async () => {
    if (!selectedCustomerId) return
    setError('')
    try {
      await api.post('/api/admin/invoices/finalize', {
        customerId: selectedCustomerId,
        year: selectedYear,
        month: selectedMonth,
        adjustments: Number(adjustments) || 0,
        adjustmentReason,
      })
      setSuccess('Invoice finalized successfully.')
      setShowGenerateModal(false)
      setPreviewInvoice(null)
      fetchInvoices()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finalize invoice.')
    }
  }

  const handleBulkGenerate = async () => {
    if (!window.confirm(`Generate finalized monthly invoices for all customers for ${selectedMonth}/${selectedYear}?`)) return
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/api/admin/invoices/bulk-generate', {
        year: selectedYear,
        month: selectedMonth,
      })
      setSuccess(`Generated ${res.data.length} invoices successfully.`)
      fetchInvoices()
    } catch (err) {
      setError('Bulk invoice generation failed.')
    }
  }

  const handleDownloadPdf = async (invoiceId) => {
    try {
      const res = await api.get(`/api/admin/invoices/${invoiceId}/pdf`, {
        params: { lang: i18n.language },
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice_${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      setError('Failed to download PDF invoice.')
    }
  }

  return (
    <div>
      {/* Title */}
      <div className="page-header">
        <div>
          <h2>{t('nav.invoices')}</h2>
          <p className="card-subtitle">{t('invoice.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBulkGenerate}
          >
            <Layers size={16} />
            <span>{t('invoice.bulkGenerateBtn')}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSelectedCustomerId('')
              setAdjustments('0.00')
              setAdjustmentReason('')
              setPreviewInvoice(null)
              setShowGenerateModal(true)
            }}
          >
            <FileText size={16} />
            <span>Create Customer Invoice</span>
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

      {/* Filter Period */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>{t('invoice.year')}:</label>
            <select
              className="form-control"
              style={{ width: '110px' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>{t('invoice.month')}:</label>
            <select
              className="form-control"
              style={{ width: '130px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {[
                { val: 1, name: 'January' },
                { val: 2, name: 'February' },
                { val: 3, name: 'March' },
                { val: 4, name: 'April' },
                { val: 5, name: 'May' },
                { val: 6, name: 'June' },
                { val: 7, name: 'July' },
                { val: 8, name: 'August' },
                { val: 9, name: 'September' },
                { val: 10, name: 'October' },
                { val: 11, name: 'November' },
                { val: 12, name: 'December' },
              ].map((m) => (
                <option key={m.val} value={m.val}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('invoice.invoiceNumber')}</th>
                <th>{t('customer.customerNumber')}</th>
                <th>{t('customer.name')}</th>
                <th>Cow Milk</th>
                <th>Buffalo Milk</th>
                <th>Milk Charges</th>
                <th>Prev. Balance</th>
                <th>Final Due</th>
                <th>{t('invoice.status')}</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>{t('common.loading')}</td></tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className="badge badge-blue" style={{ fontFamily: 'monospace' }}>
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td>{inv.customerNumber}</td>
                    <td style={{ fontWeight: 600 }}>{inv.customerName}</td>
                    <td>{inv.totalCowQuantity}L (₹{inv.cowCharges})</td>
                    <td>{inv.totalBuffaloQuantity}L (₹{inv.buffaloCharges})</td>
                    <td>₹{Number(inv.totalMilkCharges || 0).toFixed(2)}</td>
                    <td>₹{Number(inv.previousOutstandingBalance || 0).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: '#dc2626' }}>
                      ₹{Number(inv.finalAmountDue || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={inv.status === 'PAID' ? 'badge badge-success' : inv.status === 'FINALIZED' ? 'badge badge-blue' : 'badge badge-warning'}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadPdf(inv.id)}
                        title={t('invoice.downloadPdf')}
                      >
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No invoices generated yet for {selectedMonth}/{selectedYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate / Preview Modal */}
      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Create / Preview Customer Invoice</h3>
              <button type="button" onClick={() => setShowGenerateModal(false)} className="btn btn-secondary btn-sm">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('invoice.selectCustomer')} *</label>
                <select
                  className="form-control"
                  value={selectedCustomerId}
                  onChange={(e) => { setSelectedCustomerId(e.target.value); setPreviewInvoice(null); }}
                  required
                >
                  <option value="">-- Choose a Customer --</option>
                  {activeCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerNumber} - {c.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('invoice.adjustments')} (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={adjustments}
                    onChange={(e) => setAdjustments(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('invoice.adjustmentReason')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="e.g. Festival discount or correction"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handlePreview}
                  disabled={!selectedCustomerId || previewLoading}
                >
                  <Eye size={15} />
                  <span>{previewLoading ? 'Calculating...' : t('invoice.previewBtn')}</span>
                </button>
              </div>

              {/* Preview Card */}
              {previewInvoice && (
                <div style={{ background: 'var(--color-bg-app)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
                    Invoice Preview ({selectedMonth}/{selectedYear})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div>Cow Milk: <strong>{previewInvoice.totalCowQuantity}L</strong> (₹{previewInvoice.cowCharges})</div>
                    <div>Buffalo Milk: <strong>{previewInvoice.totalBuffaloQuantity}L</strong> (₹{previewInvoice.buffaloCharges})</div>
                    <div>Total Milk Charges: <strong>₹{previewInvoice.totalMilkCharges}</strong></div>
                    <div>Previous Outstanding: <strong>₹{previewInvoice.previousOutstandingBalance}</strong></div>
                    <div>Adjustments: <strong>₹{previewInvoice.adjustments}</strong></div>
                    <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '1.1rem', color: '#dc2626' }}>
                      Final Amount Due: <strong>₹{previewInvoice.finalAmountDue}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>
                {t('customer.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinalize}
                disabled={!previewInvoice}
              >
                <FileCheck2 size={16} />
                <span>{t('invoice.finalizeBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
