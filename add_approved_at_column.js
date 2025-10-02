const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addApprovedAtColumn() {
  try {
    console.log('Adding approved_at column to id_verifications table...');

    // Use raw SQL to add the column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.id_verifications
        ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
      `
    });

    if (error) {
      console.error('Error adding column:', error);
      process.exit(1);
    }

    console.log('Column added successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addApprovedAtColumn();
