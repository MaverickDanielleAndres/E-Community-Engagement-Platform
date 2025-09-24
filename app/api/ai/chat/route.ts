
// @/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get or create session
    let sessionId = nanoid()
    let userId = null

    if (session?.user?.email) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single()
      
      if (user) {
        userId = user.id
        
        // Get existing session or create new one
        const { data: chatSession } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (chatSession) {
          sessionId = chatSession.id
        } else {
          const { data: newSession } = await supabase
            .from('chat_sessions')
            .insert({
              user_id: user.id,
              session_token: sessionId
            })
            .select()
            .single()
          
          if (newSession) sessionId = newSession.id
        }
      }
    }

    // Generate response using mock AI - replace with actual AI service
    const response = await generateChatResponse(message, history)

    // Store messages if user is logged in
    if (userId) {
      await supabase.from('chat_messages').insert([
        {
          session_id: sessionId,
          role: 'user',
          content: message
        },
        {
          session_id: sessionId,
          role: 'assistant',
          content: response
        }
      ])
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

async function generateChatResponse(message: string, history: any[]): Promise<string> {
  // Mock AI response - replace with actual AI service (OpenAI, etc.)
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('complaint') || lowerMessage.includes('submit')) {
    return "To submit a complaint, go to the 'Complaints' section in your dashboard and click 'Submit Complaint'. You can categorize your complaint as Maintenance, Governance, or Other, and provide detailed information about the issue."
  }
  
  if (lowerMessage.includes('poll') || lowerMessage.includes('vote')) {
    return "You can participate in community polls by visiting the 'Voting' section. Active polls will show voting options, and you can cast your vote if you're a registered community member. Results are displayed in real-time charts."
  }
  
  if (lowerMessage.includes('admin') || lowerMessage.includes('administrator')) {
    return "Community administrators manage polls, review complaints, and oversee community activities. You can identify admins by their role badge, and they have access to additional management features like analytics and member management."
  }
  
  if (lowerMessage.includes('feedback')) {
    return "You can share feedback about the community through the 'Feedback' section. Rate your experience from 1-5 stars and optionally add comments. Your feedback helps improve community services and engagement."
  }
  
  return "I'm here to help with community-related questions! You can ask me about submitting complaints, voting on polls, providing feedback, or general community information. What would you like to know?"
}