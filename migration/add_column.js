const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addApprovedAtColumn() {
  try {
    console.log('Adding approved_at column...');

    // Try to add the column directly (this might work if we have permissions)
    const { error } = await supabase
      .from('id_verifications')
      .select('approved_at')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log('Column does not exist, you need to add it manually in Supabase dashboard');
      console.log('Run this SQL in your Supabase SQL Editor:');
      console.log('ALTER TABLE public.id_verifications ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;');
    } else {
      console.log('Column exists or we can access it');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.log('Please add the approved_at column manually in Supabase dashboard with:');
    console.log('ALTER TABLE public.id_verifications ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;');
  }
}

addApprovedAtColumn();
