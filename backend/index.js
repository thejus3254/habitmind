const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const habitsRoute = require('./routes/habits')
const aiRoute = require('./routes/ai')

const app = express()
app.use(cors())
app.use(express.json())

// Ensure required environment variables are set before loading routes
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
	console.error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set.')
	console.error('Create a .env file in the backend folder with these values, or set them in your environment.')
	process.exit(1)
}

app.use('/api/habits', habitsRoute)
app.use('/api/ai', aiRoute)

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`HabitMind server running on port ${PORT}`))