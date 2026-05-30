const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function inspect() {
  console.log('Inspecting habits table structure...');
  try {
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .limit(1);

    if (habitsError) {
      console.error('Error fetching from habits:', habitsError);
    } else {
      console.log('Habits table sample row keys:', habits.length > 0 ? Object.keys(habits[0]) : 'Empty table');
    }

    console.log('\nInspecting completions table structure...');
    const { data: completions, error: completionsError } = await supabase
      .from('completions')
      .select('*')
      .limit(1);

    if (completionsError) {
      console.error('Error fetching from completions:', completionsError);
    } else {
      console.log('Completions table sample row keys:', completions.length > 0 ? Object.keys(completions[0]) : 'Empty table');
    }

    // Check if a reminders table exists
    console.log('\nChecking if reminders table exists...');
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')
      .limit(1);

    if (remindersError) {
      console.log('Reminders table does not exist or error:', remindersError.message);
    } else {
      console.log('Reminders table exists! Sample keys:', reminders.length > 0 ? Object.keys(reminders[0]) : 'Empty table');
    }
  } catch (err) {
    console.error('Inspection failed:', err);
  }
}

inspect();
