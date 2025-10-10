import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabaseClient'

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      await supabase.auth.getSession()
      navigate('/', { replace: true })
    }

    handleCallback()
  }, [navigate])

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="loading loading-spinner loading-lg mx-auto" />
        <p className="text-sm text-base-content/60">Completing sign in…</p>
      </div>
    </main>
  )
}

export default AuthCallback
