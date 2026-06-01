const express = require('express')
const router = express.Router()

// Async error wrapping helper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// UUID v4 format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Allowed enum values
const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const VALID_LEVELS = ['Mandatory', 'Optional', 'Aspirational']
const MAX_NAME_LENGTH = 200
const MAX_NOTES_LENGTH = 1000

function stripHtml(str) {
  if (typeof str !== 'string') return str
  return str.replace(/<[^>]*>/g, '').trim()
}

function validateUUID(id) {
  return UUID_REGEX.test(id)
}

function normalizeSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') {
    return { rule: 'Daily', days: [] }
  }

  const rule = typeof schedule.rule === 'string' ? schedule.rule : 'Daily'
  const days = Array.isArray(schedule.days) ? schedule.days : []
  const date = typeof schedule.date === 'string' ? schedule.date : null
  return { rule, days, date }
}

function isScheduledOnDate(habit, dateStr) {
  const schedule = normalizeSchedule(habit.schedule)
  const date = new Date(dateStr)
  const dayOfMonth = date.getUTCDate()
  const dayOfWeek = date.getUTCDay() // 0 = Sunday, 1 = Monday

  if (schedule.rule === 'Daily') return true
  if (schedule.rule === 'Even Days') return dayOfMonth % 2 === 0
  if (schedule.rule === 'Odd Days') return dayOfMonth % 2 === 1
  if (schedule.rule === 'Weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5
  if (schedule.rule === 'Twice a Week') return [1, 4].includes(dayOfWeek)
  if (schedule.rule === 'Once') return schedule.date === dateStr
  if (schedule.rule === 'Custom') {
    return schedule.days.some((day) => {
      if (typeof day === 'number') return day === dayOfWeek
      return String(day).toLowerCase() === [
        'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
      ][dayOfWeek].toLowerCase()
    })
  }

  return true
}

// GET all habits with today's completion status and streak — OPTIMIZED: batch queries
router.get('/', asyncHandler(async (req, res) => {
  const today = req.query.date || new Date().toISOString().split('T')[0]

  // Single query to fetch all habits
  const { data: habits, error } = await req.supabase
    .from('habits')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!habits || habits.length === 0) {
    return res.json({ success: true, data: [] })
  }

  const habitIds = habits.map(h => h.id)

  // Batch query: get today's completions for ALL habits at once
  const { data: todayCompletions } = await req.supabase
    .from('completions')
    .select('habit_id')
    .eq('user_id', req.user.id)
    .eq('completed_date', today)
    .in('habit_id', habitIds)

  const todaySet = new Set((todayCompletions || []).map(c => c.habit_id))

  // Batch query: get ALL completions for streak calculation
  const { data: allCompletions } = await req.supabase
    .from('completions')
    .select('habit_id, completed_date')
    .eq('user_id', req.user.id)
    .in('habit_id', habitIds)
    .order('completed_date', { ascending: false })

  // Group completions by habit_id
  const completionsByHabit = {}
  for (const c of (allCompletions || [])) {
    if (!completionsByHabit[c.habit_id]) completionsByHabit[c.habit_id] = []
    completionsByHabit[c.habit_id].push(c.completed_date)
  }

  // Calculate streak for each habit in-memory
  const enriched = habits.map((habit) => {
    const completions = completionsByHabit[habit.id] || []
    let streak = 0

    if (completions.length > 0) {
      const completedDates = new Set(completions)
      const start = new Date(today + 'T00:00:00.000Z')
      if (!completedDates.has(today)) {
        start.setUTCDate(start.getUTCDate() - 1)
      }
      for (let i = 0; ; i++) {
        const d = new Date(start.getTime())
        d.setUTCDate(d.getUTCDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        if (completedDates.has(dateStr)) {
          streak++
        } else {
          break
        }
      }
    }

    return {
      ...habit,
      completed_today: todaySet.has(habit.id),
      streak,
      scheduled_today: isScheduledOnDate(habit, today)
    }
  })

  res.json({ success: true, data: enriched })
}))

// GET calendar view for a specific day
router.get('/calendar', asyncHandler(async (req, res) => {
  const selectedDate = req.query.date || new Date().toISOString().split('T')[0]

  const [{ data: habits, error: habitError }, { data: completions, error: completionError }] = await Promise.all([
    req.supabase.from('habits').select('*').eq('user_id', req.user.id).order('created_at', { ascending: true }),
    req.supabase.from('completions').select('habit_id').eq('user_id', req.user.id).eq('completed_date', selectedDate)
  ])

  if (habitError) throw habitError
  if (completionError) throw completionError

  const completedSet = new Set(completions.map(c => c.habit_id))

  const enriched = habits.map((habit) => ({
    ...habit,
    scheduled: isScheduledOnDate(habit, selectedDate),
    completed_today: completedSet.has(habit.id),
    scheduled_day: selectedDate
  }))

  res.json({ success: true, selectedDate, data: enriched })
}))

// POST create a new habit
router.post('/', asyncHandler(async (req, res) => {
  let {
    name,
    difficulty,
    category,
    target,
    level,
    schedule,
    reminder_time,
    notes
  } = req.body

  // Validate and sanitize name
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Habit name is required' })
  name = stripHtml(name).substring(0, MAX_NAME_LENGTH)
  if (!name) return res.status(400).json({ error: 'Habit name is required' })

  // Validate enums
  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
    difficulty = 'Medium'
  }
  if (level && !VALID_LEVELS.includes(level)) {
    level = 'Mandatory'
  }

  // Sanitize notes
  if (notes) {
    notes = stripHtml(String(notes)).substring(0, MAX_NOTES_LENGTH)
  }

  const payload = {
    name,
    difficulty: difficulty || 'Medium',
    category: category || 'General',
    target: target || null,
    level: level || 'Mandatory',
    schedule: normalizeSchedule(schedule),
    reminder_time: reminder_time || null,
    notes: notes || null,
    user_id: req.user.id
  }

  const { data, error } = await req.supabase
    .from('habits')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  res.json({ success: true, data })
}))

// PATCH update habit fields such as reminder or schedule
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!validateUUID(id)) return res.status(400).json({ error: 'Invalid habit ID format' })

  let {
    name,
    difficulty,
    category,
    target,
    level,
    schedule,
    reminder_time,
    notes
  } = req.body

  const updatePayload = {}
  if (name !== undefined) {
    name = stripHtml(String(name)).substring(0, MAX_NAME_LENGTH)
    if (name) updatePayload.name = name
  }
  if (difficulty !== undefined) {
    updatePayload.difficulty = VALID_DIFFICULTIES.includes(difficulty) ? difficulty : 'Medium'
  }
  if (category !== undefined) updatePayload.category = category
  if (target !== undefined) updatePayload.target = target
  if (level !== undefined) {
    updatePayload.level = VALID_LEVELS.includes(level) ? level : 'Mandatory'
  }
  if (schedule !== undefined) updatePayload.schedule = normalizeSchedule(schedule)
  if (reminder_time !== undefined) updatePayload.reminder_time = reminder_time
  if (notes !== undefined) {
    updatePayload.notes = notes ? stripHtml(String(notes)).substring(0, MAX_NOTES_LENGTH) : null
  }

  const { data, error } = await req.supabase
    .from('habits')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single()

  if (error) throw error
  res.json({ success: true, data })
}))

// POST toggle completion for a specific date
router.post('/:id/toggle', asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!validateUUID(id)) return res.status(400).json({ error: 'Invalid habit ID format' })

  const date = req.query.date || new Date().toISOString().split('T')[0]

  // SECURE AUTHZ check: Verify that the habit belongs to the active user
  const { data: habit, error: habitErr } = await req.supabase
    .from('habits')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single()
    
  if (habitErr || !habit) {
    return res.status(403).json({ error: 'You are not authorized to modify this habit' })
  }

  const { data: existing } = await req.supabase
    .from('completions')
    .select('id')
    .eq('habit_id', id)
    .eq('user_id', req.user.id)
    .eq('completed_date', date)
    .single()

  if (existing) {
    await req.supabase.from('completions').delete().eq('id', existing.id).eq('user_id', req.user.id)
    res.json({ success: true, completed: false, date })
  } else {
    await req.supabase.from('completions').insert([{ habit_id: id, completed_date: date, user_id: req.user.id }])
    res.json({ success: true, completed: true, date })
  }
}))

// DELETE a habit
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!validateUUID(id)) return res.status(400).json({ error: 'Invalid habit ID format' })

  const { error } = await req.supabase.from('habits').delete().eq('id', id).eq('user_id', req.user.id)
  if (error) throw error
  res.json({ success: true })
}))

// GET completion history for last 28 days (for dot grid)
router.get('/:id/history', asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!validateUUID(id)) return res.status(400).json({ error: 'Invalid habit ID format' })

  const from = new Date()
  from.setDate(from.getDate() - 27)
  const fromStr = from.toISOString().split('T')[0]

  // SECURE AUTHZ check: Verify that the habit belongs to the active user
  const { data: habit, error: habitErr } = await req.supabase
    .from('habits')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single()
    
  if (habitErr || !habit) {
    return res.status(403).json({ error: 'You are not authorized to view this habit' })
  }

  const { data, error } = await req.supabase
    .from('completions')
    .select('completed_date')
    .eq('habit_id', id)
    .eq('user_id', req.user.id)
    .gte('completed_date', fromStr)

  if (error) throw error
  res.json({ success: true, data: data.map(d => d.completed_date) })
}))

module.exports = router