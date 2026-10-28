import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, History, FileText, BookOpen, UserCheck } from 'lucide-react'

export default function CustomerNav() {
  const { t } = useTranslation()

  const links = [
    { to: '/customer/dashboard', icon: LayoutDashboard, label: t('nav.myDashboard') },
    { to: '/customer/milk-history', icon: History, label: t('nav.myMilkHistory') },
    { to: '/customer/invoices', icon: FileText, label: t('nav.myInvoices') },
    { to: '/customer/ledger', icon: BookOpen, label: t('nav.myPassbook') },
    { to: '/customer/profile', icon: UserCheck, label: t('nav.myProfile') },
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
