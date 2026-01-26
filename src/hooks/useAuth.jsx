import { useState, useEffect, createContext, useContext } from 'react'
import { supabase, getUcitelProfile } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [ucitel, setUcitel] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Získej aktuální session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUcitelProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Poslouchej změny auth stavu
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadUcitelProfile(session.user.id)
        } else {
          setUcitel(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUcitelProfile = async (userId) => {
    try {
      const profile = await getUcitelProfile(userId)
      setUcitel(profile)
    } catch (error) {
      console.error('Chyba při načítání profilu:', error)
      setUcitel(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
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
