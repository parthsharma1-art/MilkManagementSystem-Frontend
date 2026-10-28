import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import AdminNav from './components/AdminNav'
import CustomerNav from './components/CustomerNav'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import CustomerManagement from './pages/CustomerManagement'
import DailyMilkEntry from './pages/DailyMilkEntry'
import ImageUploadOcr from './pages/ImageUploadOcr'
import MonthlyReports from './pages/MonthlyReports'
import InvoiceManagement from './pages/InvoiceManagement'
import PaymentsAndLedger from './pages/PaymentsAndLedger'
import SettingsAndRates from './pages/SettingsAndRates'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerMilkHistory from './pages/CustomerMilkHistory'
import CustomerInvoices from './pages/CustomerInvoices'
import CustomerLedger from './pages/CustomerLedger'
import CustomerProfile from './pages/CustomerProfile'

function AppContent() {
  const { isAuthenticated, isAdmin, isCustomer } = useAuth()
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="app-layout">
      <Navbar />

      {/* Role-specific Navigation Bar */}
      {isAuthenticated && isAdmin && !isAuthPage && <AdminNav />}
      {isAuthenticated && isCustomer && !isAuthPage && <CustomerNav />}

      <main className="content-area">
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRole="ROLE_ADMIN" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/customers" element={<CustomerManagement />} />
            <Route path="/admin/daily-entry" element={<DailyMilkEntry />} />
            <Route path="/admin/upload-ocr" element={<ImageUploadOcr />} />
            <Route path="/admin/reports" element={<MonthlyReports />} />
            <Route path="/admin/invoices" element={<InvoiceManagement />} />
            <Route path="/admin/payments" element={<PaymentsAndLedger />} />
            <Route path="/admin/settings" element={<SettingsAndRates />} />
          </Route>

          {/* Customer Protected Routes */}
          <Route element={<ProtectedRoute allowedRole="ROLE_CUSTOMER" />}>
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/milk-history" element={<CustomerMilkHistory />} />
            <Route path="/customer/invoices" element={<CustomerInvoices />} />
            <Route path="/customer/ledger" element={<CustomerLedger />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
          </Route>

          {/* Root and Fallback Redirection */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                isAdmin ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/customer/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
