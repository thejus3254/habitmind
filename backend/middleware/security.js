const crypto = require('crypto')

// Attach unique request ID for tracing
function requestId(req, res, next) {
  req.id = crypto.randomUUID()
  res.setHeader('X-Request-Id', req.id)
  next()
}

// Recursively sanitize strings — strip null bytes
function sanitizeValue(val) {
  if (typeof val === 'string') {
    return val.replace(/\0/g, '')
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue)
  }
  if (val && typeof val === 'object') {
    const clean = {}
    for (const key of Object.keys(val)) {
      clean[key] = sanitizeValue(val[key])
    }
    return clean
  }
  return val
}

function inputSanitizer(req, res, next) {
  if (req.body) req.body = sanitizeValue(req.body)
  if (req.query) req.query = sanitizeValue(req.query)
  if (req.params) req.params = sanitizeValue(req.params)
  next()
}

// Request logger
function requestLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms [${req.id}]`)
  })
  next()
}

module.exports = { requestId, inputSanitizer, requestLogger }
