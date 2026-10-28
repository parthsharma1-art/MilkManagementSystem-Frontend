import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { useTranslation } from 'react-i18next'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const { i18n } = useTranslation()
  const [token, setToken] = useState(localStorage.getItem('milk_token'))
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('milk_user')
    return saved ? JSON.parse(saved) : null
  })
  const [language, setLanguage] = useState(localStorage.getItem('milk_lang') || 'en')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language)
      localStorage.setItem('milk_lang', language)
    }
  }, [language, i18n])

  const login = async (username, password) => {
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { username, password })
      const data = res.data
      setToken(data.token)
      setUser(data)
      localStorage.setItem('milk_token', data.token)
      localStorage.setItem('milk_user', JSON.stringify(data))

      if (data.preferredLanguage) {
        setLanguage(data.preferredLanguage)
      }

      return data
    } finally {
      setLoading(false)
    }
  }

  const register = async (customerData) => {
    setLoading(true)
    try {
      const res = await api.post('/api/auth/register-customer', customerData)
      const data = res.data
      setToken(data.token)
      setUser(data)
      localStorage.setItem('milk_token', data.token)
      localStorage.setItem('milk_user', JSON.stringify(data))

      if (data.preferredLanguage) {
        setLanguage(data.preferredLanguage)
      }

      return data
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('milk_token')
    localStorage.removeItem('milk_user')
    window.location.href = '/'
  }

  const switchLanguage = (newLang) => {
    setLanguage(newLang)
    if (token) {
      api.post('/api/auth/language', { language: newLang }).catch(() => {})
    }
  }

  const isAdmin = user?.role === 'ROLE_ADMIN'
  const isCustomer = user?.role === 'ROLE_CUSTOMER'

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isAdmin,
        isCustomer,
        language,
        loading,
        login,
        register,
        logout,
        switchLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
