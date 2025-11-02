import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mock virus scanning function
export async function scanForViruses(filePath: string): Promise<{ infected: boolean; details?: string }> {
  // In production, integrate with actual virus scanning service like ClamAV, VirusTotal, etc.
  // For now, return mock result
  console.log(`Scanning file for viruses: ${filePath}`)

  // Mock logic - in real implementation, this would scan the actual file
  const mockInfected = Math.random() < 0.01 // 1% chance of false positive for testing

  return {
    infected: mockInfected,
    details: mockInfected ? 'Mock virus detected' : undefined
  }
}

// Content moderation function
export async function moderateContent(filePath: string, mimeType: string): Promise<{
  flagged: boolean;
  reason?: string;
  confidence?: number;
}> {
  try {
    console.log(`Moderating content: ${filePath} (${mimeType})`)

    // For images, use AI-based content moderation
    if (mimeType.startsWith('image/')) {
      return await moderateImage(filePath)
    }

    // For text files, check for inappropriate content
    if (mimeType === 'text/plain' || mimeType.includes('document')) {
      return await moderateText(filePath)
    }

    // Default: allow other file types
    return { flagged: false }
  } catch (error) {
    console.error('Error in content moderation:', error)
    // On error, allow the content but log it
    return { flagged: false }
  }
}

// Image moderation using existing AI services
async function moderateImage(filePath: string): Promise<{
  flagged: boolean;
  reason?: string;
  confidence?: number;
}> {
  try {
    // Download the image from Supabase storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('message-media')
      .download(filePath)

    if (downloadError || !imageData) {
      console.error('Error downloading image for moderation:', downloadError)
      return { flagged: false }
    }

    // Convert blob to base64 for AI processing
    const buffer = await imageData.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`

    // Use existing AI anomaly detection endpoint (adapt for content moderation)
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/anomaly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: dataUrl,
        type: 'image'
      })
    })

    if (!response.ok) {
      console.error('AI moderation service error')
      return { flagged: false }
    }

    const result = await response.json()

    // Mock decision based on anomaly score
    const flagged = result.anomaly_score > 0.7 // Threshold for flagging
    const reason = flagged ? 'Potential inappropriate content detected' : undefined

    return {
      flagged,
      reason,
      confidence: result.anomaly_score
    }
  } catch (error) {
    console.error('Error in image moderation:', error)
    return { flagged: false }
  }
}

// Text moderation
async function moderateText(filePath: string): Promise<{
  flagged: boolean;
  reason?: string;
  confidence?: number;
}> {
  try {
    // Download the text file
    const { data: textData, error: downloadError } = await supabase.storage
      .from('message-media')
      .download(filePath)

    if (downloadError || !textData) {
      console.error('Error downloading text for moderation:', downloadError)
      return { flagged: false }
    }

    const text = await textData.text()

    // Use existing sentiment analysis
    const sentimentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })

    if (!sentimentResponse.ok) {
      console.error('Sentiment analysis error')
      return { flagged: false }
    }

    const sentimentResult = await sentimentResponse.json()

    // Check for extremely negative content or inappropriate keywords
    const inappropriateKeywords = [
      'hate', 'violence', 'abuse', 'harassment', 'threat',
      'discrimination', 'illegal', 'drugs', 'weapons'
    ]

    const hasInappropriateContent = inappropriateKeywords.some(keyword =>
      text.toLowerCase().includes(keyword)
    )

    const extremelyNegative = sentimentResult.sentiment < -0.8

    const flagged = hasInappropriateContent || extremelyNegative
    const reason = flagged ?
      (hasInappropriateContent ? 'Inappropriate keywords detected' : 'Extremely negative content') :
      undefined

    return {
      flagged,
      reason,
      confidence: Math.abs(sentimentResult.sentiment)
    }
  } catch (error) {
    console.error('Error in text moderation:', error)
    return { flagged: false }
  }
}
