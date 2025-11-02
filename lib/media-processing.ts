import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate thumbnail for images
export async function generateImageThumbnail(filePath: string, mimeType: string): Promise<void> {
  try {
    console.log(`Generating thumbnail for image: ${filePath}`)

    // Download the original image
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('message-media')
      .download(filePath)

    if (downloadError || !imageData) {
      console.error('Error downloading image for thumbnail generation:', downloadError)
      return
    }

    // In production, use a service like Sharp, ImageMagick, or Cloudinary for thumbnail generation
    // For now, we'll create a simple placeholder thumbnail path
    const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumb.jpg')

    // Mock thumbnail generation - in real implementation, resize the image
    const thumbnailBuffer = await imageData.arrayBuffer()
    // Here you would resize the image using Sharp or similar library

    // Upload the thumbnail
    const { error: uploadError } = await supabase.storage
      .from('message-media')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError)
      return
    }

    // Update the attachment record with thumbnail path
    const fileName = filePath.split('/').pop()
    if (fileName) {
      await supabase
        .from('message_attachments')
        .update({ thumbnail_path: thumbnailPath })
        .eq('storage_path', filePath)
    }

    console.log(`Thumbnail generated: ${thumbnailPath}`)
  } catch (error) {
    console.error('Error generating image thumbnail:', error)
  }
}

// Transcode video and generate thumbnail
export async function transcodeVideo(filePath: string, mimeType: string): Promise<void> {
  try {
    console.log(`Transcoding video: ${filePath}`)

    // In production, use FFmpeg or a cloud service like Cloudinary/Zencoder
    // For now, we'll simulate transcoding by creating placeholder files

    const basePath = filePath.replace(/\.[^/.]+$/, '')
    const transcodedPath = `${basePath}_transcoded.mp4`
    const thumbnailPath = `${basePath}_thumb.jpg`

    // Mock transcoding - download original and re-upload as "transcoded"
    const { data: videoData, error: downloadError } = await supabase.storage
      .from('message-media')
      .download(filePath)

    if (downloadError || !videoData) {
      console.error('Error downloading video for transcoding:', downloadError)
      return
    }

    // Upload "transcoded" version (same data for demo)
    const { error: transcodeError } = await supabase.storage
      .from('message-media')
      .upload(transcodedPath, videoData, {
        contentType: 'video/mp4',
        upsert: true
      })

    if (transcodeError) {
      console.error('Error uploading transcoded video:', transcodeError)
      return
    }

    // Generate thumbnail from video (placeholder)
    const thumbnailBuffer = new ArrayBuffer(1024) // Mock thumbnail data
    const { error: thumbError } = await supabase.storage
      .from('message-media')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (thumbError) {
      console.error('Error uploading video thumbnail:', thumbError)
      return
    }

    // Update attachment with transcoded path and thumbnail
    const fileName = filePath.split('/').pop()
    if (fileName) {
      await supabase
        .from('message_attachments')
        .update({
          storage_path: transcodedPath,
          thumbnail_path: thumbnailPath
        })
        .eq('storage_path', filePath)
    }

    console.log(`Video transcoded: ${transcodedPath}, thumbnail: ${thumbnailPath}`)
  } catch (error) {
    console.error('Error transcoding video:', error)
  }
}

// Process audio files (voicemails)
export async function processAudio(filePath: string, mimeType: string): Promise<void> {
  try {
    console.log(`Processing audio file: ${filePath}`)

    // For voicemails, we might want to:
    // 1. Normalize audio levels
    // 2. Convert to standard format (e.g., MP3)
    // 3. Generate waveform data for visualization
    // 4. Extract duration metadata

    // Mock processing - in real implementation, use FFmpeg or similar
    const processedPath = filePath.replace(/\.[^/.]+$/, '_processed.mp3')

    // Download and "process" the audio
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('message-media')
      .download(filePath)

    if (downloadError || !audioData) {
      console.error('Error downloading audio for processing:', downloadError)
      return
    }

    // Upload processed version
    const { error: uploadError } = await supabase.storage
      .from('message-media')
      .upload(processedPath, audioData, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading processed audio:', uploadError)
      return
    }

    // Update attachment with processed path and metadata
    const fileName = filePath.split('/').pop()
    if (fileName) {
      await supabase
        .from('message_attachments')
        .update({
          storage_path: processedPath,
          metadata: {
            processed: true,
            original_format: mimeType,
            processed_at: new Date().toISOString()
          }
        })
        .eq('storage_path', filePath)
    }

    console.log(`Audio processed: ${processedPath}`)
  } catch (error) {
    console.error('Error processing audio:', error)
  }
}

// Delete attachment and associated files
export async function deleteAttachment(attachmentId: string): Promise<void> {
  try {
    console.log(`Deleting attachment: ${attachmentId}`)

    // Get attachment details
    const { data: attachment, error: fetchError } = await supabase
      .from('message_attachments')
      .select('storage_path, thumbnail_path')
      .eq('id', attachmentId)
      .single()

    if (fetchError || !attachment) {
      console.error('Error fetching attachment for deletion:', fetchError)
      return
    }

    // Delete files from storage
    const filesToDelete = [attachment.storage_path]
    if (attachment.thumbnail_path) {
      filesToDelete.push(attachment.thumbnail_path)
    }

    for (const filePath of filesToDelete) {
      const { error: deleteError } = await supabase.storage
        .from('message-media')
        .remove([filePath])

      if (deleteError) {
        console.error(`Error deleting file ${filePath}:`, deleteError)
      }
    }

    // Delete attachment record
    const { error: recordError } = await supabase
      .from('message_attachments')
      .delete()
      .eq('id', attachmentId)

    if (recordError) {
      console.error('Error deleting attachment record:', recordError)
    }

    console.log(`Attachment deleted: ${attachmentId}`)
  } catch (error) {
    console.error('Error deleting attachment:', error)
  }
}

// Clean up orphaned files (files not referenced in attachments)
export async function cleanupOrphanedFiles(): Promise<void> {
  try {
    console.log('Starting orphaned file cleanup')

    // Get all files in message-media bucket
    const { data: files, error: listError } = await supabase.storage
      .from('message-media')
      .list('', { limit: 1000 })

    if (listError) {
      console.error('Error listing files for cleanup:', listError)
      return
    }

    if (!files) return

    // Get all referenced storage paths
    const { data: attachments, error: attachError } = await supabase
      .from('message_attachments')
      .select('storage_path, thumbnail_path')

    if (attachError) {
      console.error('Error fetching attachments for cleanup:', attachError)
      return
    }

    const referencedPaths = new Set<string>()
    attachments?.forEach(att => {
      referencedPaths.add(att.storage_path)
      if (att.thumbnail_path) {
        referencedPaths.add(att.thumbnail_path)
      }
    })

    // Find orphaned files
    const orphanedFiles = files
      .map(file => file.name)
      .filter(filePath => !referencedPaths.has(filePath))

    if (orphanedFiles.length > 0) {
      // Delete orphaned files
      const { error: deleteError } = await supabase.storage
        .from('message-media')
        .remove(orphanedFiles)

      if (deleteError) {
        console.error('Error deleting orphaned files:', deleteError)
      } else {
        console.log(`Deleted ${orphanedFiles.length} orphaned files`)
      }
    } else {
      console.log('No orphaned files found')
    }
  } catch (error) {
    console.error('Error in cleanup process:', error)
  }
}
