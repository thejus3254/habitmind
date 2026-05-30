const { createClient } = require('@supabase/supabase-js')

// Global Supabase client used for token verification
const globalSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

/**
 * Authentication & Authorization Middleware
 * Verifies the JWT bearer token, checks with Supabase Auth,
 * and sets up a user-scoped Supabase client for Database Row Level Security (RLS).
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' })
  }

  const token = authHeader.split(' ')[1]

  try {
    // 1. Verify user JWT token with Supabase Auth
    const { data: { user }, error } = await globalSupabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: 'Session expired or invalid authorization token' })
    }

    // 2. Attach user metadata to request
    req.user = user

    // 3. SECURE AUTHZ: Initialize a request-scoped Supabase client using the user's JWT
    // Any queries made with this client will automatically be evaluated by Supabase RLS policies.
    req.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    next()
  } catch (err) {
    console.error('Authentication middleware error:', err)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

module.exports = requireAuth
