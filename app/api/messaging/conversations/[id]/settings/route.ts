import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient()

    // Check if user is participant in conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get conversation settings
    const { data: settings, error: settingsError } = await supabase
      .from('conversation_settings')
      .select('*')
      .eq('conversation_id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({
      settings: settings || {
        customTitle: null,
        isMuted: false,
        muteUntil: null
      }
    })
  } catch (error) {
    console.error('Error in conversation settings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customTitle, isMuted, muteUntil } = body

    const supabase = getSupabaseClient()

    // Check if user is participant in conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Update or insert conversation settings
    const { data: settings, error: settingsError } = await (supabase
      .from('conversation_settings') as any)
      .upsert({
        conversation_id: params.id,
        user_id: session.user.id,
        custom_title: customTitle || null,
        is_muted: isMuted || false,
        mute_until: muteUntil || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'conversation_id,user_id'
      })
      .select()
      .single()

    if (settingsError) {
      console.error('Error updating settings:', settingsError)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error in conversation settings PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
