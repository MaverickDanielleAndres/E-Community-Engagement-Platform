const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addMediaUrlsColumn() {
  try {
    console.log('Adding media_urls column to complaints table...')

    // Add the media_urls column as text array (IF NOT EXISTS will prevent errors if it already exists)
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT \'{}\'::text[]'
    })

    if (error) {
      console.error('Error adding media_urls column:', error)
      process.exit(1)
    }

    console.log('media_urls column added successfully to complaints table!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

addMediaUrlsColumn()
