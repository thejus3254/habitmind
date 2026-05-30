const express = require('express')
const router = express.Router()

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

// GET all habits with today's completion status and streak
router.get('/', async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().split('T')[0]

    const { data: habits, error } = await req.supabase
      .from('habits')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    // For each habit, get today's completion and streak
    const enriched = await Promise.all(habits.map(async (habit) => {
      // Check today's completion
      const { data: todayData } = await req.supabase
        .from('completions')
        .select('id')
        .eq('habit_id', habit.id)
        .eq('user_id', req.user.id)
        .eq('completed_date', today)
        .single()

      // Calculate streak
      const { data: completions } = await req.supabase
        .from('completions')
        .select('completed_date')
        .eq('habit_id', habit.id)
        .eq('user_id', req.user.id)
        .order('completed_date', { ascending: false })

      let streak = 0
      if (completions && completions.length > 0) {
        const completedDates = new Set(completions.map(c => c.completed_date))
        // Start from today if completed today, otherwise start from yesterday
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
        completed_today: !!todayData,
        streak,
        scheduled_today: isScheduledOnDate(habit, today)
      }
    }))

    res.json({ success: true, data: enriched })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch habits' })
  }
})

// GET calendar view for a specific day
router.get('/calendar', async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load calendar data' })
  }
})

// POST create a new habit
router.post('/', async (req, res) => {
  const {
    name,
    difficulty,
    category,
    target,
    level,
    schedule,
    reminder_time,
    notes
  } = req.body

  if (!name) return res.status(400).json({ error: 'Habit name is required' })

  try {
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
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create habit' })
  }
})

// PATCH update habit fields such as reminder or schedule
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const {
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
  if (name !== undefined) updatePayload.name = name
  if (difficulty !== undefined) updatePayload.difficulty = difficulty
  if (category !== undefined) updatePayload.category = category
  if (target !== undefined) updatePayload.target = target
  if (level !== undefined) updatePayload.level = level
  if (schedule !== undefined) updatePayload.schedule = normalizeSchedule(schedule)
  if (reminder_time !== undefined) updatePayload.reminder_time = reminder_time
  if (notes !== undefined) updatePayload.notes = notes

  try {
    const { data, error } = await req.supabase
      .from('habits')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update habit' })
  }
})

// POST toggle completion for a specific date
router.post('/:id/toggle', async (req, res) => {
  const { id } = req.params
  const date = req.query.date || new Date().toISOString().split('T')[0]

  try {
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
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to toggle habit' })
  }
})

// DELETE a habit
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const { error } = await req.supabase.from('habits').delete().eq('id', id).eq('user_id', req.user.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete habit' })
  }
})

// GET completion history for last 28 days (for dot grid)
router.get('/:id/history', async (req, res) => {
  const { id } = req.params
  const from = new Date()
  from.setDate(from.getDate() - 27)
  const fromStr = from.toISOString().split('T')[0]

  try {
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
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})
module.exports = router