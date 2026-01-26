import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Chybí Supabase credentials. Zkontroluj .env soubor.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper pro získání aktuálního uživatele
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper pro získání profilu učitele
export const getUcitelProfile = async (userId) => {
  const { data, error } = await supabase
    .from('ucitel')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}
