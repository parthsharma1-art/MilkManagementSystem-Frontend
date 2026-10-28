import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { FileText, Download, AlertCircle } from 'lucide-react'

export default function CustomerInvoices() {
  const { t, i18n } = useTranslation()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>{t('nav.myInvoices')}</h2>
        <p className="card-subtitle">Monthly billing statements and downloadable PDF receipts</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Period</th>
                <th>Cow Milk</th>
                <th>Buffalo Milk</th>
                <th>Current Charges</th>
                <th>Previous Due</th>
                <th>Total Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Download</th>
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
                    <td>{inv.totalCowQuantity}L (₹{inv.cowCharges})</td>
                    <td>{inv.totalBuffaloQuantity}L (₹{inv.buffaloCharges})</td>
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
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                      >
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No finalized invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
