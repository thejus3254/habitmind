const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

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
  const dayOfMonth = date.getDate()
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday

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

    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error

    // For each habit, get today's completion and streak
    const enriched = await Promise.all(habits.map(async (habit) => {
      // Check today's completion
      const { data: todayData } = await supabase
        .from('completions')
        .select('id')
        .eq('habit_id', habit.id)
        .eq('completed_date', today)
        .single()

      // Calculate streak
      const { data: completions } = await supabase
        .from('completions')
        .select('completed_date')
        .eq('habit_id', habit.id)
        .order('completed_date', { ascending: false })

      let streak = 0
      if (completions && completions.length > 0) {
        const completedDates = new Set(completions.map(c => c.completed_date))
        // Start from today if completed today, otherwise start from yesterday
        const start = new Date(today)
        if (!completedDates.has(today)) {
          start.setDate(start.getDate() - 1)
        }
        for (let i = 0; ; i++) {
          const d = new Date(start)
          d.setDate(d.getDate() - i)
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
      supabase.from('habits').select('*').order('created_at', { ascending: true }),
      supabase.from('completions').select('habit_id').eq('completed_date', selectedDate)
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
      notes: notes || null
    }

    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('habits')
      .update(updatePayload)
      .eq('id', id)
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
    const { data: existing } = await supabase
      .from('completions')
      .select('id')
      .eq('habit_id', id)
      .eq('completed_date', date)
      .single()

    if (existing) {
      await supabase.from('completions').delete().eq('id', existing.id)
      res.json({ success: true, completed: false, date })
    } else {
      await supabase.from('completions').insert([{ habit_id: id, completed_date: date }])
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
    const { error } = await supabase.from('habits').delete().eq('id', id)
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
    const { data, error } = await supabase
      .from('completions')
      .select('completed_date')
      .eq('habit_id', id)
      .gte('completed_date', fromStr)

    if (error) throw error
    res.json({ success: true, data: data.map(d => d.completed_date) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})
module.exports = router