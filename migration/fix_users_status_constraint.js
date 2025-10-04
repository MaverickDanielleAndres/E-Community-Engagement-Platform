const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStatusConstraint() {
  try {
    console.log('Dropping existing users_status_check constraint...');
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;'
    });

    if (dropError) {
      console.error('Error dropping constraint:', dropError);
      return;
    }

    console.log('Adding new users_status_check constraint with all valid statuses...');
    const { error: addError } = await supabase.rpc('execute_sql', {
      sql: "ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('unverified', 'pending', 'approved', 'rejected'));"
    });

    if (addError) {
      console.error('Error adding constraint:', addError);
      return;
    }

    console.log('Constraint updated successfully. Now supports: unverified, pending, approved, rejected');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

fixStatusConstraint();
