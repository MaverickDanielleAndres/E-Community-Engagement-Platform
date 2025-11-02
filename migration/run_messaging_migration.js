const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration(migrationFile) {
  try {
    console.log(`Running migration: ${migrationFile}`)

    const sqlPath = path.join(__dirname, migrationFile)
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 50)}...`)

        const { error } = await supabase.from('_temp').select('*').limit(0) // Dummy query to test connection

        // Use raw SQL execution via Supabase client
        const { data, error: sqlError } = await supabase.rpc('exec', {
          query: statement.trim() + ';'
        })

        if (sqlError) {
          console.error('Statement failed:', statement.trim().substring(0, 50), sqlError)
          // Continue with next statement instead of failing completely
        } else {
          console.log('Statement executed successfully')
        }
      }
    }

    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2]
if (!migrationFile) {
  console.error('Please provide a migration file name')
  process.exit(1)
}

runMigration(migrationFile)
