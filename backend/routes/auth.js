const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

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
router.post('/signup', async (req, res) => {
  const { email, password } = req.body

  // 1. Check required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
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

  try {
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
  } catch (err) {
    console.error('Signup security validation failed:', err)
    res.status(400).json({ error: err.message || 'Registration failed.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
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
    res.status(400).json({ error: err.message || 'Invalid email or password.' })
  }
})

module.exports = router
