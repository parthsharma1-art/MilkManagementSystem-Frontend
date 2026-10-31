import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

export function useCapacitorNative() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const initNativeUI = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: '#0f172a' })
      } catch (e) {
        // Non-fatal if StatusBar plugin unavailable
      }

      try {
        await SplashScreen.hide()
      } catch (e) {
        // Non-fatal if SplashScreen already hidden
      }
    }

    initNativeUI()
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let lastBackPressTime = 0

    const backListenerPromise = CapApp.addListener('backButton', () => {
      const currentPath = location.pathname

      // Root and primary landing screens where back exits app
      const isExitRoute =
        currentPath === '/' ||
        currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/admin/dashboard' ||
        currentPath === '/customer/dashboard'

      if (isExitRoute) {
        const now = Date.now()
        // Double-tap back button within 2 seconds to exit
        if (now - lastBackPressTime < 2000) {
          CapApp.exitApp()
        } else {
          lastBackPressTime = now
          if (window.navigator?.vibrate) {
            window.navigator.vibrate(40)
          }
        }
      } else {
        // Regular back navigation inside React Router
        navigate(-1)
      }
    })

    return () => {
      backListenerPromise.then((handle) => handle.remove?.())
    }
  }, [location.pathname, navigate])
}

