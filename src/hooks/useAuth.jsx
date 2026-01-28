import { useState, useEffect, createContext, useContext } from 'react'
import { supabase, getUcitelProfile } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [ucitel, setUcitel] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadUcitelProfile = async (userId) => {
      try {
        console.log('[Auth] Načítám profil učitele:', userId)
        const profile = await getUcitelProfile(userId)
        if (isMounted) {
          console.log('[Auth] Profil načten:', profile)
          setUcitel(profile)
        }
      } catch (error) {
        console.error('[Auth] Chyba při načítání profilu:', error)
        if (isMounted) {
          setUcitel(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Supabase v2: onAuthStateChange se spustí OKAMŽITĚ s INITIAL_SESSION
    // Nepotřebujeme volat getSession() zvlášť
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth event:', event, session?.user?.email)

        if (!isMounted) return

        setUser(session?.user ?? null)

        if (session?.user) {
          // Použijeme setTimeout aby se React stih renderovat
          // a zabráníme Supabase deadlocku při RLS
          setTimeout(() => {
            if (isMounted) {
              loadUcitelProfile(session.user.id)
            }
          }, 0)
        } else {
          setUcitel(null)
          setLoading(false)
        }
      }
    )

    // Fallback timeout - pokud se do 10s nic nestane, ukonči loading
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Auth] Timeout - ukončuji loading')
        setLoading(false)
      }
    }, 10000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    ucitel,
    loading,
    signIn,
    signOut,
    isAdmin: ucitel?.role === 'admin',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth musí být použit uvnitř AuthProvider')
  }
  return context
}
