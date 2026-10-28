import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Users, CalendarCheck, UploadCloud, BarChart3, FileText, CreditCard, Settings } from 'lucide-react'

export default function AdminNav() {
  const { t } = useTranslation()

  const links = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/admin/customers', icon: Users, label: t('nav.customers') },
    { to: '/admin/daily-entry', icon: CalendarCheck, label: t('nav.dailyEntry') },
    { to: '/admin/upload-ocr', icon: UploadCloud, label: t('nav.ocrUpload') },
    { to: '/admin/reports', icon: BarChart3, label: t('nav.reports') },
    { to: '/admin/invoices', icon: FileText, label: t('nav.invoices') },
    { to: '/admin/payments', icon: CreditCard, label: t('nav.payments') },
    { to: '/admin/settings', icon: Settings, label: t('nav.settings') },
  ]

  return (
    <nav className="nav-bar">
      {links.map((link) => {
        const Icon = link.icon
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
