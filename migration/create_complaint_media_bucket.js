const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBucket() {
  try {
    console.log('Creating complaint-media bucket...')

    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets.some(bucket => bucket.name === 'complaint-media')

    if (bucketExists) {
      console.log('Bucket "complaint-media" already exists.')
      return
    }

    // Create the bucket
    const { error } = await supabase.storage.createBucket('complaint-media', {
      public: false
    })

    if (error) {
      console.error('Error creating bucket:', error)
      process.exit(1)
    }

    console.log('Bucket "complaint-media" created successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

createBucket()
