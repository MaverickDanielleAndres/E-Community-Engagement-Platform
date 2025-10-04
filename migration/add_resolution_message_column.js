const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addResolutionMessageColumn() {
  try {
    console.log('Adding resolution_message column to complaints table...');

    // Try to add the column directly (this might work if we have permissions)
    const { error } = await supabase
      .from('complaints')
      .select('resolution_message')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log('Column does not exist, you need to add it manually in Supabase dashboard');
      console.log('Run this SQL in your Supabase SQL Editor:');
      console.log('ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS resolution_message text;');
    } else {
      console.log('Column exists or we can access it');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.log('Please add the resolution_message column manually in Supabase dashboard with:');
    console.log('ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS resolution_message text;');
  }
}

addResolutionMessageColumn();
