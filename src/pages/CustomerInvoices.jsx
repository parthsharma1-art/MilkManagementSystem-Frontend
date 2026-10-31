import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { FileText, Download, AlertCircle, CheckCircle, Eye, Calculator, X } from 'lucide-react'

export default function CustomerInvoices() {
  const { t, i18n } = useTranslation()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // View complete invoice modal
  const [viewInvoice, setViewInvoice] = useState(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/customer/invoices')
      setInvoices(res.data || [])
    } catch (err) {
      setError('Failed to fetch invoices.')
    } finally {
      setLoading(false)
    }
  }

  const handleCalculateCurrentBill = async () => {
    setCalculating(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/api/customer/calculate-bill')
      const calculatedInv = res.data
      setSuccess(`✅ Successfully calculated current month bill! Total due: ₹${Number(calculatedInv.finalAmountDue || 0).toFixed(2)}`)
      setViewInvoice(calculatedInv)
      fetchInvoices()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate bill for the current month.')
    } finally {
      setCalculating(false)
    }
  }

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const res = await api.get(`/api/customer/invoices/${invoiceId}/pdf`, {
        params: { lang: i18n.language },
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice_${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      alert('Failed to download invoice PDF.')
    }
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>{t('nav.myInvoices')}</h2>
          <p className="card-subtitle">Monthly billing statements, real-time bill calculation, and downloadable receipts</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCalculateCurrentBill}
          disabled={calculating}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, padding: '0.6rem 1.25rem' }}
        >
          <Calculator size={18} />
          <span>{calculating ? 'Calculating Current Month...' : '⚡ Calculate Current Month Bill / बिल की गणना करें'}</span>
        </button>
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

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Period</th>
                <th>Cow Milk (गाय)</th>
                <th>Buffalo Milk (भैंस)</th>
                <th>Milk Charges</th>
                <th>Previous Due</th>
                <th>Total Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', minWidth: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>{t('common.loading')}</td></tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className="badge badge-blue" style={{ fontFamily: 'monospace' }}>
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td>{inv.billingMonth}/{inv.billingYear}</td>
                    <td>{inv.totalCowQuantity} L (₹{inv.cowCharges})</td>
                    <td>{inv.totalBuffaloQuantity} L (₹{inv.buffaloCharges})</td>
                    <td>₹{Number(inv.totalMilkCharges || 0).toFixed(2)}</td>
                    <td>₹{Number(inv.previousOutstandingBalance || 0).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: '#dc2626' }}>
                      ₹{Number(inv.finalAmountDue || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={inv.status === 'PAID' ? 'badge badge-success' : 'badge badge-blue'}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewInvoice(inv)}
                          title="View Complete Invoice / पूरा बिल देखें"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                          title={t('invoice.downloadPdf')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Download size={14} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No finalized invoices yet. Click "Calculate Current Month Bill" above to generate your latest bill.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Invoice Modal */}
      {viewInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Invoice Details / चालान विवरण</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  #{viewInvoice.invoiceNumber} &bull; Period: {viewInvoice.billingMonth}/{viewInvoice.billingYear}
                </span>
              </div>
              <button type="button" onClick={() => setViewInvoice(null)} className="btn btn-secondary btn-sm">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Customer Info Card */}
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Billed To:</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{viewInvoice.customerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Customer ID: {viewInvoice.customerNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mobile Number:</div>
                    <div style={{ fontWeight: 600 }}>{viewInvoice.customerMobile || '—'}</div>
                    <span className={viewInvoice.status === 'PAID' ? 'badge badge-success' : 'badge badge-blue'} style={{ marginTop: '4px' }}>
                      {viewInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Itemized Milk Consumption:</h4>
              <div className="table-responsive" style={{ marginBottom: '1rem' }}>
                <table className="data-table" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th>Milk Description</th>
                      <th style={{ textAlign: 'right' }}>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Rate (₹/L)</th>
                      <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Number(viewInvoice.totalCowQuantity || 0) > 0 && (
                      <tr>
                        <td>🐄 Cow Milk (गाय का दूध)</td>
                        <td style={{ textAlign: 'right' }}>{viewInvoice.totalCowQuantity} L</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(viewInvoice.cowRate || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(viewInvoice.cowCharges || 0).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(viewInvoice.totalBuffaloQuantity || 0) > 0 && (
                      <tr>
                        <td>🐃 Buffalo Milk (भैंस का दूध)</td>
                        <td style={{ textAlign: 'right' }}>{viewInvoice.totalBuffaloQuantity} L</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(viewInvoice.buffaloRate || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(viewInvoice.buffaloCharges || 0).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(viewInvoice.totalCowQuantity || 0) === 0 && Number(viewInvoice.totalBuffaloQuantity || 0) === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No milk consumption recorded for this period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Breakdown */}
              <div style={{ background: 'var(--color-bg-app)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.875rem' }}>
                  <div>Current Month Milk Charges:</div>
                  <div style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(viewInvoice.totalMilkCharges || 0).toFixed(2)}</div>

                  <div>Previous Pending Balance:</div>
                  <div style={{ textAlign: 'right', fontWeight: 600, color: Number(viewInvoice.previousOutstandingBalance || 0) > 0 ? '#b45309' : undefined }}>
                    ₹{Number(viewInvoice.previousOutstandingBalance || 0).toFixed(2)}
                  </div>

                  {Number(viewInvoice.adjustments || 0) !== 0 && (
                    <>
                      <div>Adjustments:</div>
                      <div style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(viewInvoice.adjustments || 0).toFixed(2)}</div>
                    </>
                  )}

                  {Number(viewInvoice.paymentsAllocated || 0) > 0 && (
                    <>
                      <div>Payments Credited:</div>
                      <div style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                        - ₹{Number(viewInvoice.paymentsAllocated || 0).toFixed(2)}
                      </div>
                    </>
                  )}

                  <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '2px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total Balance Due / कुल देय राशि:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>
                      ₹{Number(viewInvoice.finalAmountDue || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleDownloadPdf(viewInvoice.id, viewInvoice.invoiceNumber)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={15} /> Download PDF Receipt
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setViewInvoice(null)}>
                Close / बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
