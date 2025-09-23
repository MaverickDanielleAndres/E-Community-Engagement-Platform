
// @/app/api/ai/classify/route.ts
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

    const textHash = createHash('md5').update(text).digest('hex')

    // Check cache
    const { data: cached } = await supabase
      .from('topic_cache')
      .select('predicted_category, confidence')
      .eq('text_hash', textHash)
      .single()

    if (cached) {
      return NextResponse.json({
        category: cached.predicted_category,
        confidence: cached.confidence,
        cached: true
      })
    }

    // Mock classification
    const category = classifyText(text)
    const confidence = 0.82

    // Cache result
    await supabase
      .from('topic_cache')
      .insert({
        text_hash: textHash,
        predicted_category: category,
        confidence
      })

    return NextResponse.json({
      category,
      confidence,
      cached: false
    })
  } catch (error) {
    console.error('Classification error:', error)
    return NextResponse.json({ error: 'Failed to classify text' }, { status: 500 })
  }
}

function classifyText(text: string): string {
  const lowerText = text.toLowerCase()
  
  const maintenanceKeywords = ['repair', 'fix', 'broken', 'maintenance', 'water', 'electricity', 'road', 'light', 'facility']
  const governanceKeywords = ['policy', 'rule', 'meeting', 'decision', 'budget', 'administration', 'governance', 'management']
  
  const maintenanceScore = maintenanceKeywords.reduce((score, keyword) => 
    score + (lowerText.includes(keyword) ? 1 : 0), 0)
  const governanceScore = governanceKeywords.reduce((score, keyword) => 
    score + (lowerText.includes(keyword) ? 1 : 0), 0)
  
  if (maintenanceScore > governanceScore && maintenanceScore > 0) return 'maintenance'
  if (governanceScore > 0) return 'governance'
  return 'other'
}