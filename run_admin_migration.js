const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runAdminMigration() {
  try {
    console.log('Running admin role migration...')

    const sql = fs.readFileSync('sql/add_admin_role.sql', 'utf8')

    const { error } = await supabase.rpc('exec_sql', {
      sql: sql
    })

    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }

    console.log('Admin role migration completed successfully')
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
}

runAdminMigration()
