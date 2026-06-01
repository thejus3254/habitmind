import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://acipozcourlwxuioqxhj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjaXBvemNvdXJsd3h1aW9xeGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NjU3MzAsImV4cCI6MjA5NTU0MTczMH0.IRYt1VRNVoijobdVNwIfp4eMhkJBti5MJuhOi3GAoqM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
