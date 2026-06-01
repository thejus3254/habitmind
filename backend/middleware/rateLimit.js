const rateLimit = require('express-rate-limit')
const slowDown = require('express-slow-down')

// Global rate limiter: 100 requests per 15 minutes per IP
// Uses default keyGenerator which handles IPv6 properly
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please try again later.' })
  }
})

// Auth rate limiter: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many authentication attempts. Please try again in 15 minutes.' })
  }
})

// AI rate limiter: 20 requests per 15 minutes per IP
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please try again later.' },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many AI requests. Please try again later.' })
  }
})

// Progressive slow down for all routes: delay increases after 50 requests in 15 min
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => (hits - 50) * 200,
  maxDelayMs: 5000
})

// Per-user rate limiting for authenticated API routes (keyed by user ID)
const perUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || 'anonymous',
  message: { error: 'Too many requests from your account. Please slow down.' },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests from your account. Please slow down.' })
  },
  validate: false
})

module.exports = { globalLimiter, authLimiter, aiLimiter, speedLimiter, perUserLimiter }
