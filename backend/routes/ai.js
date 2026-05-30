const express = require('express')
const router = express.Router()
const Groq = require('groq-sdk')
const { createClient } = require('@supabase/supabase-js')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// POST - rate difficulty of a habit name
router.post('/rate-difficulty', async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Habit name required' })

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `Rate the difficulty of this habit: "${name}". 
Reply with ONLY one word: Easy, Medium, or Hard. Nothing else.`
      }],
      temperature: 0.2
    })

    const difficulty = completion.choices[0].message.content.trim()
    res.json({ success: true, difficulty })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to rate difficulty' })
  }
})

// GET - daily coach message based on streaks
router.get('/coach', async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().split('T')[0]

    const { data: habits } = await supabase.from('habits').select('*')

    if (!habits || habits.length === 0) {
      return res.json({ success: true, message: "Add your first habit to get started on your journey!" })
    }

    // Get completion data for context
    const habitSummary = await Promise.all(habits.map(async (h) => {
      const { data: completions } = await supabase
        .from('completions')
        .select('completed_date')
        .eq('habit_id', h.id)
        .order('completed_date', { ascending: false })
        .limit(7)

      const { data: todayData } = await supabase
        .from('completions')
        .select('id')
        .eq('habit_id', h.id)
        .eq('completed_date', today)
        .single()

      return {
        name: h.name,
        difficulty: h.difficulty,
        completions_last_7_days: completions?.length || 0,
        done_today: !!todayData
      }
    }))

    const prompt = `You are a personal habit coach. Here is the user's habit data for today:
${JSON.stringify(habitSummary, null, 2)}

Write a short, warm, personalized coaching message (2-3 sentences) based on their progress.
Be encouraging but honest. Mention specific habits by name. Do not use emojis.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })

    const message = completion.choices[0].message.content.trim()
    res.json({ success: true, message })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get coach message' })
  }
})

// GET - weekly insight report
router.get('/weekly-insight', async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().split('T')[0]
    const refDate = new Date(today)
    const sevenDaysAgo = new Date(refDate)
    sevenDaysAgo.setDate(refDate.getDate() - 6)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const { data: habits } = await supabase.from('habits').select('*')

    if (!habits || habits.length === 0) {
      return res.json({ success: true, insight: "No habits tracked yet. Start adding habits to get weekly insights." })
    }

    const weeklyData = await Promise.all(habits.map(async (h) => {
      const { data: completions } = await supabase
        .from('completions')
        .select('completed_date')
        .eq('habit_id', h.id)
        .gte('completed_date', sevenDaysAgoStr)
        .lte('completed_date', today)

      return {
        habit: h.name,
        difficulty: h.difficulty,
        days_completed: completions?.length || 0,
        completion_rate: `${Math.round(((completions?.length || 0) / 7) * 100)}%`
      }
    }))

    const prompt = `You are a habit analyst. Here is the user's past 7 days of habit data:
${JSON.stringify(weeklyData, null, 2)}

Give a weekly insight report with:
1. Overall assessment (1 sentence)
2. Strongest habit this week
3. Habit that needs the most attention
4. One specific actionable tip for next week

Keep it concise, friendly, and data-driven. No emojis.

Respond in this exact JSON format:
{
  "overall": "...",
  "strongest": "...",
  "needs_attention": "...",
  "tip": "..."
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    })

    const raw = completion.choices[0].message.content.trim()
    const clean = raw.replace(/```json|```/g, '').trim()
    let insight
    try {
      insight = JSON.parse(clean)
    } catch (parseErr) {
      console.error('Failed to parse weekly insight JSON:', clean)
      insight = {
        overall: 'Unable to parse the weekly report. Please try refreshing.',
        strongest: 'N/A',
        needs_attention: 'N/A',
        tip: 'Try refreshing to get a new insight.'
      }
    }

    res.json({ success: true, insight })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate weekly insight' })
  }
})

// POST - suggest new habits based on existing ones
router.post('/suggest', async (req, res) => {
  try {
    const { data: habits } = await supabase.from('habits').select('name')

    if (!habits || habits.length === 0) {
      return res.json({ success: true, suggestions: ['Morning walk', 'Read 10 pages', 'Drink 2L water'] })
    }

    const habitNames = habits.map(h => h.name).join(', ')

    const prompt = `A person is already tracking these habits: ${habitNames}.

Suggest 3 new complementary habits they are NOT already tracking.
Respond ONLY in this exact JSON format with no extra text:
{
  "suggestions": ["habit one", "habit two", "habit three"]
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    })

    const raw = completion.choices[0].message.content.trim()
    const clean = raw.replace(/```json|```/g, '').trim()
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (parseErr) {
      console.error('Failed to parse suggestions JSON:', clean)
      parsed = { suggestions: ['Morning walk', 'Read 10 pages', 'Drink 2L water'] }
    }

    res.json({ success: true, suggestions: parsed.suggestions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate suggestions' })
  }
})

// POST - chat with AI coach
router.post('/chat', async (req, res) => {
  const { messages } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  try {
    const systemPrompt = {
      role: 'system',
      content: `You are a supportive, warm, and highly experienced Habit Coach. 
Your goal is to help the user build healthy routines, stay motivated, and troubleshoot habit failures.
Give actionable, realistic advice (1-2 short paragraphs). Be encouraging, friendly, and structured. 
Do not use emojis.`
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [systemPrompt, ...messages],
      temperature: 0.7
    })

    const reply = completion.choices[0].message.content.trim()
    res.json({ success: true, reply })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'AI Coach failed to reply' })
  }
})

module.exports = router