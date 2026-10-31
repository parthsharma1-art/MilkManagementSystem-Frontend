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
  Calculator,
} from 'lucide-react'

export default function InvoiceManagement() {
  const { t, i18n } = useTranslation()

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [invoices, setInvoices] = useState([])
  const [activeCustomers, setActiveCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [calculatingAll, setCalculatingAll] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Single Generate / Preview Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [adjustments, setAdjustments] = useState('0.00')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [previewInvoice, setPreviewInvoice] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Complete Invoice Inspection Modal (Eye Button)
  const [viewingInvoice, setViewingInvoice] = useState(null)

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

  const handleCalculateAll = async () => {
    setCalculatingAll(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/api/admin/invoices/calculate-all', {
        year: selectedYear,
        month: selectedMonth,
      })
      setSuccess(`✅ Successfully calculated monthly milk and generated/updated invoices for ${res.data.length} customers for ${selectedMonth}/${selectedYear}!`)
      fetchInvoices()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate invoices for all users.')
    } finally {
      setCalculatingAll(false)
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
        <div className="page-header-actions" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCalculateAll}
            disabled={calculatingAll}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, background: '#0284c7' }}
          >
            <Calculator size={16} />
            <span>{calculatingAll ? 'Calculating All Customers...' : '⚡ Calculate All Bills / सभी बिलों की गणना करें'}</span>
          </button>

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
            className="btn btn-secondary"
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
                <th>Cow Milk (गाय)</th>
                <th>Buffalo Milk (भैंस)</th>
                <th>Milk Charges</th>
                <th>Prev. Balance</th>
                <th>Final Due</th>
                <th>{t('invoice.status')}</th>
                <th style={{ textAlign: 'right', minWidth: '150px' }}>Actions</th>
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
                      <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewingInvoice(inv)}
                          title="View Complete Invoice / पूरा बिल देखें"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDownloadPdf(inv.id)}
                          title={t('invoice.downloadPdf')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Download size={14} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No invoices generated yet for {selectedMonth}/{selectedYear}. Click "Calculate All Bills" to calculate current month milk consumption and pending dues.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Eye Button: Complete Invoice Inspection Modal */}
      {viewingInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Customer Invoice Details (बिल विवरण)</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  #{viewingInvoice.invoiceNumber} &bull; Billing Period: {viewingInvoice.billingMonth}/{viewingInvoice.billingYear}
                </span>
              </div>
              <button type="button" onClick={() => setViewingInvoice(null)} className="btn btn-secondary btn-sm">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Customer Info Card */}
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Customer:</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{viewingInvoice.customerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ID: {viewingInvoice.customerNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mobile Number:</div>
                    <div style={{ fontWeight: 600 }}>{viewingInvoice.customerMobile || '—'}</div>
                    <span className={viewingInvoice.status === 'PAID' ? 'badge badge-success' : 'badge badge-blue'} style={{ marginTop: '4px' }}>
                      {viewingInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Breakdown Table */}
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Milk Consumption & Rate Breakdown:</h4>
              <div className="table-responsive" style={{ marginBottom: '1rem' }}>
                <table className="data-table" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th>Milk Type</th>
                      <th style={{ textAlign: 'right' }}>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Rate (₹/L)</th>
                      <th style={{ textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Number(viewingInvoice.totalCowQuantity || 0) > 0 && (
                      <tr>
                        <td>🐄 Cow Milk (गाय का दूध)</td>
                        <td style={{ textAlign: 'right' }}>{viewingInvoice.totalCowQuantity} L</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(viewingInvoice.cowRate || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(viewingInvoice.cowCharges || 0).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(viewingInvoice.totalBuffaloQuantity || 0) > 0 && (
                      <tr>
                        <td>🐃 Buffalo Milk (भैंस का दूध)</td>
                        <td style={{ textAlign: 'right' }}>{viewingInvoice.totalBuffaloQuantity} L</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(viewingInvoice.buffaloRate || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(viewingInvoice.buffaloCharges || 0).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(viewingInvoice.totalCowQuantity || 0) === 0 && Number(viewingInvoice.totalBuffaloQuantity || 0) === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No milk recorded for this month.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Dues & Financial Summary Box */}
              <div style={{ background: 'var(--color-bg-app)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.875rem' }}>
                  <div>Total Milk Charges:</div>
                  <div style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(viewingInvoice.totalMilkCharges || 0).toFixed(2)}</div>

                  <div>Previous Pending Balance:</div>
                  <div style={{ textAlign: 'right', fontWeight: 600, color: Number(viewingInvoice.previousOutstandingBalance || 0) > 0 ? '#b45309' : undefined }}>
                    ₹{Number(viewingInvoice.previousOutstandingBalance || 0).toFixed(2)}
                  </div>

                  {Number(viewingInvoice.adjustments || 0) !== 0 && (
                    <>
                      <div>Adjustments ({viewingInvoice.adjustmentReason || 'General'}):</div>
                      <div style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(viewingInvoice.adjustments || 0).toFixed(2)}</div>
                    </>
                  )}

                  {Number(viewingInvoice.paymentsAllocated || 0) > 0 && (
                    <>
                      <div>Payments Credited:</div>
                      <div style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                        - ₹{Number(viewingInvoice.paymentsAllocated || 0).toFixed(2)}
                      </div>
                    </>
                  )}

                  <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '2px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>Final Amount Due / कुल बकाया:</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#dc2626' }}>
                      ₹{Number(viewingInvoice.finalAmountDue || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleDownloadPdf(viewingInvoice.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={15} /> Download PDF
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setViewingInvoice(null)}>
                Close / बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

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
