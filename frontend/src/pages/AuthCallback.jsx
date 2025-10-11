import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabaseClient'

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href)
      const authError = url.searchParams.get('error_description') || url.searchParams.get('error')
      if (authError) {
        console.error('OAuth callback error', authError)
        navigate('/?auth=error', { replace: true })
        return
      }

      const code = url.searchParams.get('code')
      if (!code) {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !data.session) {
          console.error('OAuth callback error: missing code parameter')
          navigate('/?auth=error', { replace: true })
          return
        }

        navigate('/', { replace: true })
        return  
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('OAuth callback error', error)
        navigate('/?auth=error', { replace: true })
        return
      }

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
