import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Community code is required' }, { status: 400 })
    }

    // Find community by code
    const { data: community, error } = await supabase
      .from('communities')
      .select('id, name, code')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !community) {
      return NextResponse.json({ error: 'Invalid community code' }, { status: 404 })
    }

    return NextResponse.json({ 
      valid: true,
      community: {
        id: community.id,
        name: community.name,
        code: community.code
      }
    })
  } catch (error) {
    console.error('Code validation error:', error)
    return NextResponse.json({ error: 'Failed to validate code' }, { status: 500 })
  }
}