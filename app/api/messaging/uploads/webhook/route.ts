import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { scanForViruses, moderateContent } from '@/lib/content-moderation'
import { generateImageThumbnail, transcodeVideo, processAudio } from '@/lib/media-processing'

type WebhookRecord = {
  name: string
  bucket_id: string
}

type AuditLog = {
  actor_id: string
  action: string
  target_table: string
  target_id: string
  payload: Record<string, unknown>
  created_at?: string
}

type FileObject = {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: {
    mimetype?: string
    size?: number
  }
}

type VirusScanResult = {
  infected: boolean
}

type ModerationResult = {
  flagged: boolean
  reason?: string
  confidence?: number
}

// This webhook is called by Supabase Storage when a file is uploaded
// It processes the uploaded file for moderation, thumbnail generation, etc.
export async function POST(
  request: NextRequest
) {
  try {
    const body: { records: WebhookRecord[] } = await request.json()

    // Verify webhook signature (in production, implement proper signature verification)
    const supabase = getSupabaseServerClient()

    // Extract file information from webhook payload
    const { records } = body

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    for (const record of records) {
      const { name: filePath, bucket_id } = record

      if (bucket_id !== 'message-media') {
        continue // Only process message media uploads
      }

      // Extract conversation ID from file path
      const pathParts = filePath.split('/')
      if (pathParts.length < 3 || pathParts[0] !== 'message-media') {
        continue
      }

      const conversationId = pathParts[1]

      // Log the upload event
      await (supabase as any).from('audit_logs').insert({
        actor_id: 'system', // System-generated event
        action: 'file_uploaded',
        target_table: 'message-media',
        target_id: filePath,
        payload: {
          bucket_id,
          file_path: filePath,
          conversation_id: conversationId
        }
      })

      // Background processing
      try {
        // Get file metadata
        const { data, error: fileError } = await supabase.storage
          .from('message-media')
          .list(filePath.split('/').slice(0, -1).join('/'), {
            search: filePath.split('/').pop()
          })

        const fileData = data as FileObject[]

        if (fileError) {
          console.error('Error getting file metadata:', fileError)
        } else if (fileData && fileData.length > 0) {
          const file = fileData[0]

          // Virus scanning (mock implementation)
          const virusScanResult: VirusScanResult = await scanForViruses(filePath)
          if (virusScanResult.infected) {
            console.error(`Virus detected in file: ${filePath}`)
            // Flag the file and notify admins
            const flagEntry: Omit<AuditLog, 'created_at'> = {
              actor_id: 'system',
              action: 'file_flagged',
              target_table: 'message-media',
              target_id: filePath,
              payload: {
                reason: 'virus_detected',
                scan_result: virusScanResult
              }
            }
            await (supabase as any).from('audit_logs').insert(flagEntry)
            // TODO: Delete the file or quarantine it
            continue
          }

          // Content moderation for images/text files
          if (file.metadata?.mimetype?.startsWith('image/') ||
              file.metadata?.mimetype === 'text/plain' ||
              file.metadata?.mimetype?.includes('document')) {

            const moderationResult: ModerationResult = await moderateContent(filePath, file.metadata.mimetype)
            if (moderationResult.flagged) {
              console.warn(`Content flagged in file: ${filePath}`)
              const contentFlagEntry: Omit<AuditLog, 'created_at'> = {
                actor_id: 'system',
                action: 'content_flagged',
                target_table: 'message-media',
                target_id: filePath,
                payload: {
                  reason: moderationResult.reason,
                  confidence: moderationResult.confidence
                }
              }
              await (supabase as any).from('audit_logs').insert(contentFlagEntry)
              // TODO: Blur image, delete file, or notify moderators
            }
          }

          // Thumbnail generation for images/videos
          if (file.metadata?.mimetype?.startsWith('image/')) {
            await generateImageThumbnail(filePath, file.metadata.mimetype)
          }

          // Video transcoding and thumbnail generation
          if (file.metadata?.mimetype?.startsWith('video/')) {
            await transcodeVideo(filePath, file.metadata.mimetype)
          }

          // Audio processing for voicemails
          if (file.metadata?.mimetype?.startsWith('audio/')) {
            await processAudio(filePath, file.metadata.mimetype)
          }
        }
      } catch (processingError) {
        console.error('Error in background processing:', processingError)
      }

      console.log(`File processed: ${filePath} in conversation ${conversationId}`)
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Error processing upload webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
