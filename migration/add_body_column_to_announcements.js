const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addBodyColumnToAnnouncements() {
  try {
    console.log('Adding body column to announcements table...')

    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE announcements
        ADD COLUMN IF NOT EXISTS body TEXT;
      `
    })

    if (error) {
      console.error('Error adding body column:', error)
      return
    }

    console.log('Successfully added body column to announcements table')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

addBodyColumnToAnnouncements()
