const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  try {
    console.log('Running migration: Add description column to communities table')

    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE communities ADD COLUMN IF NOT EXISTS description TEXT;'
    })

    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }

    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
}

runMigration()
