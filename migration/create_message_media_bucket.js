require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createMessageMediaBucket() {
  try {
    console.log('Creating message-media storage bucket...')

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('message-media', {
      public: false,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
      fileSizeLimit: 20971520 // 20MB
    })

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bucket:', error)
      return
    }

    console.log('Bucket created or already exists')

    // Set up RLS policies
    const policies = [
      {
        name: 'Users can upload message media',
        definition: `
          CREATE POLICY "Users can upload message media" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'message-media'
            AND auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      },
      {
        name: 'Users can view message media in their conversations',
        definition: `
          CREATE POLICY "Users can view message media in their conversations" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'message-media'
            AND EXISTS (
              SELECT 1 FROM messages m
              JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
              WHERE cp.user_id = auth.uid()
              AND m.id::text = (storage.foldername(name))[4]
            )
          );
        `
      },
      {
        name: 'Users can delete their own message media',
        definition: `
          CREATE POLICY "Users can delete their own message media" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'message-media'
            AND auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      }
    ]

    for (const policy of policies) {
      try {
        const { error: policyError } = await supabase.rpc('exec_sql', {
          sql: policy.definition
        })

        if (policyError && !policyError.message.includes('already exists')) {
          console.error(`Error creating policy "${policy.name}":`, policyError)
        } else {
          console.log(`Policy "${policy.name}" created or already exists`)
        }
      } catch (err) {
        console.error(`Error with policy "${policy.name}":`, err)
      }
    }

    console.log('Message media bucket setup completed')
  } catch (error) {
    console.error('Error setting up message media bucket:', error)
    process.exit(1)
  }
}

createMessageMediaBucket()
