import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import SharedWishlistPage from './pages/SharedWishlistPage'
import AuthCallback from './pages/AuthCallback'
import { useThemeStore } from './store/useThemeStore'
import { useAuthStore } from './store/useAuthStore'

function App() {
  const { theme } = useThemeStore()
  const initializeAuth = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300" data-theme={theme}>
      <NavBar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/share/:slug" element={<SharedWishlistPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>

      <Toaster position="top-right" />
    </div>
  )
}

export default App
