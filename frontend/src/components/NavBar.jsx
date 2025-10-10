import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookmarkIcon, SparklesIcon, LogOutIcon, LogInIcon } from 'lucide-react'

import ThemeSelector from './ThemeSelector'
import { useProductStore } from '../store/useProductStore'
import { useAuthStore } from '../store/useAuthStore'

function NavBar() {
  const { pathname } = useLocation()
  const isHomePage = pathname === '/'
  const products = useProductStore((state) => state.products)
  const user = useAuthStore((state) => state.user)
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)
  const signOut = useAuthStore((state) => state.signOut)

  return (
    <header className="sticky top-0 z-50 border-b border-base-content/10 bg-base-100/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-base-100 shadow-lg">
            <BookmarkIcon className="size-5" />
          </span>
          <div>
            <span className="text-lg font-semibold leading-tight">Wishlist</span>
            <p className="text-xs text-base-content/60">Curate. Share. Enjoy.</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {isHomePage && user && (
            <div className="hidden items-center gap-2 rounded-full border border-base-content/10 bg-base-100/80 px-3 py-1 text-sm text-base-content/70 sm:flex">
              <SparklesIcon className="size-4 text-primary" />
              {products.length} saved
            </div>
          )}
          <ThemeSelector />
          {user ? (
            <button className="btn btn-sm btn-ghost gap-2" onClick={signOut}>
              <LogOutIcon className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : (
            <button className="btn btn-sm btn-primary gap-2" onClick={signInWithGoogle}>
              <LogInIcon className="size-4" />
              <span className="hidden sm:inline">Sign in</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}

export default NavBar
