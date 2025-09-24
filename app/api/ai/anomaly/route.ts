import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface DataPoint {
  community_id: string
  poll_id: string
  votes_per_hour: number
  timestamp: string
}

interface Anomaly {
  community_id: string
  entity_id: string
  type: string
  severity: 'low' | 'medium' | 'high'
  details: {
    votes_per_hour: number
    expected_range: string
    timestamp: string
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { entity_type, data_points, threshold = 0.7 } = await request.json()
    
    if (!entity_type || !data_points) {
      return NextResponse.json({ error: 'Entity type and data points required' }, { status: 400 })
    }

    // Mock anomaly detection
    const anomalies = detectAnomalies(entity_type, data_points as DataPoint[], threshold)
    
    // Store significant anomalies
    for (const anomaly of anomalies.filter(a => a.severity !== 'low')) {
      await supabase
        .from('anomaly_flags')
        .insert({
          community_id: anomaly.community_id,
          entity_type,
          entity_id: anomaly.entity_id,
          anomaly_type: anomaly.type,
          severity: anomaly.severity,
          details: anomaly.details
        })
    }

    return NextResponse.json({ 
      anomalies,
      total_flagged: anomalies.length 
    })
  } catch (error) {
    console.error('Anomaly detection error:', error)
    return NextResponse.json({ error: 'Failed to detect anomalies' }, { status: 500 })
  }
}

function detectAnomalies(entityType: string, dataPoints: DataPoint[], threshold: number): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  if (entityType === 'poll_voting') {
    // Check for unusual voting patterns
    dataPoints.forEach((point) => {
      if (point.votes_per_hour > 50) { // Unusual spike
        anomalies.push({
          community_id: point.community_id,
          entity_id: point.poll_id,
          type: 'unusual_voting_pattern',
          severity: point.votes_per_hour > 100 ? 'high' : 'medium',
          details: { 
            votes_per_hour: point.votes_per_hour, 
            expected_range: '5-25',
            timestamp: point.timestamp 
          }
        })
      }
    })
  }
  
  if (entityType === 'complaint_sentiment') {
    // Check for sentiment anomalies (assuming different data structure)
    dataPoints.forEach((point) => {
      // This would need proper typing based on actual complaint data structure
      if ('sentiment_score' in point && typeof point.sentiment_score === 'number') {
        if (point.sentiment_score < -0.8) {
          anomalies.push({
            community_id: point.community_id,
            entity_id: point.poll_id, // This would be complaint_id for complaints
            type: 'extreme_negative_sentiment',
            severity: point.sentiment_score < -0.9 ? 'high' : 'medium',
            details: {
              votes_per_hour: 0, // This structure should match the expected details
              expected_range: '-0.3 to 0.3',
              timestamp: point.timestamp
            }
          })
        }
      }
    })
  }
  
  return anomalies
}