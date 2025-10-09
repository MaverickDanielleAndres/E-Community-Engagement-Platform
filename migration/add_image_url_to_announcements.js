const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addImageUrlColumn() {
  try {
    console.log('Adding image_url column to announcements table...')

    // Add the image_url column as text (IF NOT EXISTS will prevent errors if it already exists)
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS image_url text'
    })

    if (error) {
      console.error('Error adding image_url column:', error)
      process.exit(1)
    }

    console.log('image_url column added successfully to announcements table!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

addImageUrlColumn()
