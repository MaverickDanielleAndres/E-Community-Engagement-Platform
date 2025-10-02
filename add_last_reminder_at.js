const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({path: '.env.local'})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addLastReminderAt() {
  try {
    console.log('Adding last_reminder_at column to users table...')

    const { error } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'users',
      column_name: 'last_reminder_at',
      column_type: 'timestamp with time zone'
    })

    if (error) {
      console.error('Failed to add last_reminder_at to users:', error)
    } else {
      console.log('last_reminder_at column added to users')
    }

    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Migration error:', error)
    process.exit(1)
  }
}

addLastReminderAt()
