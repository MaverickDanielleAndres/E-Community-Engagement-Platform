const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  try {
    console.log('Checking users table columns...')
    const { data: usersColumns, error: usersError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')

    if (usersError) throw usersError

    console.log('Users table columns:')
    console.table(usersColumns)

    console.log('\nChecking id_verifications table columns...')
    const { data: idColumns, error: idError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'id_verifications')

    if (idError) throw idError

    console.log('ID verifications table columns:')
    console.table(idColumns)

  } catch (error) {
    console.error('Error checking schema:', error)
  }
}

checkSchema()
