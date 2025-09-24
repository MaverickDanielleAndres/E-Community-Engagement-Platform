
// @/app/api/ai/sentiment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Create hash of text for caching
    const textHash = createHash('md5').update(text).digest('hex')

    // Check cache first
    const { data: cached } = await supabase
      .from('sentiment_cache')
      .select('sentiment_score, confidence')
      .eq('text_hash', textHash)
      .single()

    if (cached) {
      return NextResponse.json({
        sentiment: cached.sentiment_score,
        confidence: cached.confidence,
        cached: true
      })
    }

    // Mock sentiment analysis - replace with actual AI service
    const sentiment = analyzeSentiment(text)
    const confidence = 0.85

    // Cache result
    await supabase
      .from('sentiment_cache')
      .insert({
        text_hash: textHash,
        sentiment_score: sentiment,
        confidence
      })

    return NextResponse.json({
      sentiment,
      confidence,
      cached: false
    })
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze sentiment' }, { status: 500 })
  }
}

function analyzeSentiment(text: string): number {
  // Simple sentiment analysis - replace with actual AI model
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'satisfied']
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'unsatisfied']
  
  const words = text.toLowerCase().split(/\s+/)
  let score = 0
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) score += 1
    if (negativeWords.some(nw => word.includes(nw))) score -= 1
  })
  
  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, score / Math.max(1, words.length / 10)))
}