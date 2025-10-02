const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({path: '.env.local'})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addStatusColumns() {
  try {
    // Add status to users if not exists
    let { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved' 
        CHECK (status IN ('unverified', 'pending', 'approved', 'rejected'));
      `
    })

    if (error) {
      console.error('Failed to add status to users:', error)
    } else {
      console.log('Status column added to users')
    }

    // Update existing users
    ({ error } = await supabase.rpc('exec_sql', {
      sql: `UPDATE users SET status = 'approved' WHERE status IS NULL OR status = '';`
    }))

    if (error) {
      console.error('Failed to update existing users:', error)
    } else {
      console.log('Existing users updated')
    }

    // Add status to id_verifications if not exists
    ({ error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE id_verifications 
        ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected'));
      `
    }))

    if (error) {
      console.error('Failed to add status to id_verifications:', error)
    } else {
      console.log('Status column added to id_verifications')
    }

    // Update existing verifications
    ({ error } = await supabase.rpc('exec_sql', {
      sql: `UPDATE id_verifications SET status = 'pending' WHERE status IS NULL;`
    }))

    if (error) {
      console.error('Failed to update existing verifications:', error)
    } else {
      console.log('Existing verifications updated')
    }

    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Migration error:', error)
    process.exit(1)
  }
}

addStatusColumns()
