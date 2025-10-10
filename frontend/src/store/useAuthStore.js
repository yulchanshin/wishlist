import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

const getRedirectTo = () => {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/auth/callback`
}

let authListenerBound = false

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  initialize: async () => {
    const { data } = await supabase.auth.getSession()
    set({ user: data.session?.user ?? null, loading: false })

    if (!authListenerBound) {
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null })
      })
      authListenerBound = true
    }
  },

  signInWithGoogle: async () => {
    set({ error: null })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectTo(),
      },
    })
    if (error) {
      console.error('Google sign-in error', error)
      toast.error('Failed to sign in with Google')
      set({ error: error.message })
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign-out error', error)
      toast.error('Failed to sign out')
      return
    }
    toast.success('Signed out')
  },
}))
