const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

// Ensure required environment variables are set before loading routes/libs
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY']
const missingEnv = requiredEnv.filter(key => !process.env[key])
if (missingEnv.length > 0) {
  console.error('========================================================================')
  console.error(`ERROR: Missing required environment variable(s): ${missingEnv.join(', ')}`)
  console.error('Create a .env file in the backend folder with these values, or set them in your environment.')
  console.error('========================================================================')
  process.exit(1)
}

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const hpp = require('hpp')
const habitsRoute = require('./routes/habits')
const aiRoute = require('./routes/ai')
const authRoute = require('./routes/auth')
const requireAuth = require('./middleware/auth')
const { globalLimiter, authLimiter, aiLimiter, speedLimiter, perUserLimiter } = require('./middleware/rateLimit')
const { requestId, inputSanitizer, requestLogger } = require('./middleware/security')

const app = express()

// Trust first proxy (needed for correct IP detection behind reverse proxies)
app.set('trust proxy', 1)

// Request ID tracing
app.use(requestId)

// Request logging
app.use(requestLogger)

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL || '', "https://accounts.google.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}))

// Gzip compression for all responses
app.use(compression())

// HTTP Parameter Pollution protection
app.use(hpp())

// CORS — lock to specific origin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173'
]
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc. in dev)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

// Body parser with size limit to prevent payload abuse
app.use(express.json({ limit: '10kb' }))

// Input sanitization
app.use(inputSanitizer)

// Global rate limiter
app.use(globalLimiter)

// Progressive slow down
app.use(speedLimiter)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes with specific rate limiters
app.use('/api/auth', authLimiter, authRoute)
app.use('/api/habits', requireAuth, perUserLimiter, habitsRoute)
app.use('/api/ai', requireAuth, aiLimiter, perUserLimiter, aiRoute)

// Centralized error handler — never leak stack traces in production
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production'
  console.error(`[${new Date().toISOString()}] Error on ${req.method} ${req.path} [${req.id}]:`, err)
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' })
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload too large' })
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' })
  }
  
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : (err.message || 'Internal server error')
  })
})

// Prevent server crashes from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err)
  // Don't exit — keep the server running
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason)
})

// Graceful shutdown
let server
function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Shutting down gracefully...`)
  if (server) {
    server.close(() => {
      console.log('Server closed. Exiting.')
      process.exit(0)
    })
    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('Forced exit after timeout.')
      process.exit(1)
    }, 10000)
  } else {
    process.exit(0)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

const PORT = process.env.PORT || 3001
server = app.listen(PORT, () => console.log(`HabitMind server running on port ${PORT}`))