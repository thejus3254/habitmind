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
const habitsRoute = require('./routes/habits')
const aiRoute = require('./routes/ai')
const authRoute = require('./routes/auth')
const requireAuth = require('./middleware/auth')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoute)
app.use('/api/habits', requireAuth, habitsRoute)
app.use('/api/ai', requireAuth, aiRoute)

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`HabitMind server running on port ${PORT}`))