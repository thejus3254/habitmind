const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Async error wrapping helper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Email Regex for robust validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates password complexity:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
function validatePasswordStrength(password) {
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character.'
  return null
}

// POST /api/auth/signup
router.post('/signup', asyncHandler(async (req, res) => {
  let { email, password } = req.body

  // 1. Check required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  // Sanitize email
  email = String(email).trim().toLowerCase()

  // Input length limits
  if (email.length > 254) {
    return res.status(400).json({ error: 'Email address is too long.' })
  }
  if (password.length > 128) {
    return res.status(400).json({ error: 'Password is too long.' })
  }

  // 2. Validate email format
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format.' })
  }

  // 3. Validate password complexity
  const passwordError = validatePasswordStrength(password)
  if (passwordError) {
    return res.status(400).json({ error: passwordError })
  }

  const { data, error } = await supabase.auth.signUp({ email, password })
  
  if (error) throw error

  res.json({ 
    success: true, 
    message: 'Registration successful! Check your email for validation if required.',
    data: {
      user: {
        id: data.user.id,
        email: data.user.email
      },
      session: data.session
    }
  })
}))

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  let { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  // Sanitize email
  email = String(email).trim().toLowerCase()

  // Input length limits
  if (email.length > 254) {
    return res.status(400).json({ error: 'Email address is too long.' })
  }
  if (password.length > 128) {
    return res.status(400).json({ error: 'Password is too long.' })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) throw error

    res.json({ 
      success: true, 
      data: {
        user: {
          id: data.user.id,
          email: data.user.email
        },
        session: {
          access_token: data.session.access_token,
          expires_in: data.session.expires_in,
          refresh_token: data.session.refresh_token
        }
      }
    })
  } catch (err) {
    console.error('Login authentication failed:', err)
    // Generic error message — don't reveal whether email exists
    res.status(401).json({ error: 'Invalid email or password.' })
  }
}))

// POST /api/auth/google — Validate a Google OAuth access_token from the frontend
router.post('/google', asyncHandler(async (req, res) => {
  const { access_token } = req.body

  if (!access_token || typeof access_token !== 'string') {
    return res.status(400).json({ error: 'Access token is required.' })
  }

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(access_token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired Google authentication token.' })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email
        },
        session: {
          access_token
        }
      }
    })
  } catch (err) {
    console.error('Google auth verification failed:', err)
    res.status(401).json({ error: 'Google authentication failed.' })
  }
}))

// POST /api/auth/refresh — Refresh an expired session
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body
  if (!refresh_token || typeof refresh_token !== 'string') {
    return res.status(400).json({ error: 'Refresh token is required.' })
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token })
  if (error || !data.session) {
    return res.status(401).json({ error: 'Unable to refresh session. Please log in again.' })
  }

  res.json({
    success: true,
    data: {
      user: { id: data.user.id, email: data.user.email },
      session: {
        access_token: data.session.access_token,
        expires_in: data.session.expires_in,
        refresh_token: data.session.refresh_token
      }
    }
  })
}))

module.exports = router
