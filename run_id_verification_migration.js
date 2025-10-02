const { execSync } = require('child_process');

const migrationSQL = `
ALTER TABLE id_verifications
ADD COLUMN email text;

-- Populate the email column with the email from the users table based on user_id
UPDATE id_verifications iv
SET email = u.email
FROM users u
WHERE iv.user_id = u.id;
`;

try {
  console.log('Running migration for id_verifications table...');
  execSync(\`psql -d your_database_name -c "\${migrationSQL.replace(/\\n/g, ' ')}"\`, { stdio: 'inherit' });
  console.log('Migration completed successfully.');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
