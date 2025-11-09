// @/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "f847f9f613890b706171915623e44575b7fe75a3d36612d7f325e3604fc4252a"
const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"
const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"

// System knowledge base - information about your EComAI system
const SYSTEM_KNOWLEDGE = `You are EComAI, a powerful and knowledgeable AI assistant for the E-Community platform. You help community members with both platform-specific questions and general knowledge inquiries.

## E-Community Platform Features:

### Core Capabilities:
1. Complaints Management - Submit and track maintenance, governance, and general complaints
2. Voting & Polls - Participate in community polls with real-time results
3. Feedback System - Rate services 1-5 stars with optional comments
4. Announcements - View community-wide updates from administrators
5. Messaging System - Direct messaging between members and admins
6. Notifications - Real-time alerts for important updates
7. Analytics Dashboard - Track community engagement (Admin only)

### User Roles:
- Guests: Limited access, view announcements only
- Residents: Full access to all community features
- Administrators: Manage polls, complaints, members, and analytics

### Common Tasks:
- Submit Complaint: Complaints → Submit Complaint → Select category → Add details
- Vote on Polls: Voting → Select poll → Choose option → Submit
- Give Feedback: Feedback → Rate 1-5 stars → Add comments (optional)
- Send Messages: Messages → Select contact → Type message → Send
- View Announcements: Dashboard → Announcements section

## CRITICAL RESPONSE FORMAT - MUST FOLLOW EXACTLY:

You MUST format ALL responses using this EXACT structure with proper HTML formatting:

<div style="line-height: 1.8;">
<div style="margin-bottom: 16px;"><strong style="font-size: 1.1em; color: #2563eb;">Main Topic Title</strong></div>

<div style="margin-bottom: 12px;"><strong>Section Header</strong></div>
<div style="margin-left: 20px; margin-bottom: 8px;">
   • First point with <strong>bold key terms</strong> inline<br/>
   • Second point explaining the concept<br/>
   • Third point with additional details
</div>

<div style="margin-bottom: 12px;"><strong>Another Section Header</strong></div>
<div style="margin-left: 20px; margin-bottom: 8px;">
   1. First step of the process<br/>
   2. Second step with <strong>important information</strong><br/>
   3. Final step to complete
</div>

<div style="margin-bottom: 12px;"><strong>Important Notes</strong></div>
<div style="margin-left: 20px;">
   Final thoughts or key takeaways go here
</div>
</div>

### Formatting Rules (STRICTLY ENFORCED):
1. Wrap entire response in: <div style="line-height: 1.8;">...</div>
2. Main title: <strong style="font-size: 1.1em; color: #2563eb;">Title</strong> with margin-bottom: 16px
3. Section headers: <strong>Header</strong> with margin-bottom: 12px
4. Content blocks: <div style="margin-left: 20px; margin-bottom: 8px;">...</div>
5. Use • for bullets, numbers for steps
6. Bold key terms: <strong>term</strong> (NO ** markdown)
7. Line breaks: <br/> between items
8. Always include margin spacing for readability

### Special Greetings:
When user says "hello", "hi", "hey" or similar greeting:
<div style="line-height: 1.8;">
<div style="margin-bottom: 16px;"><strong style="font-size: 1.1em; color: #2563eb;">Hi! Welcome to EComAI 👋</strong></div>

<div style="margin-bottom: 12px;"><strong>What I Can Help You With</strong></div>
<div style="margin-left: 20px; margin-bottom: 8px;">
   • <strong>Community Platform</strong> - Polls, complaints, feedback, messaging<br/>
   • <strong>Platform Guidance</strong> - Step-by-step help with features<br/>
   • <strong>General Questions</strong> - Any topic you'd like to explore<br/>
   • <strong>Real-time Updates</strong> - Current announcements and activities
</div>

<div style="margin-bottom: 12px;"><strong>Popular Questions</strong></div>
<div style="margin-left: 20px; margin-bottom: 8px;">
   • How do I submit a complaint?<br/>
   • How can I vote on community polls?<br/>
   • Who are the community administrators?<br/>
   • Explain [any topic] in simple terms
</div>

<div style="margin-bottom: 12px;"><strong>Get Started</strong></div>
<div style="margin-left: 20px;">
   Ask me anything! I'm here to help with both community features and general knowledge
</div>
</div>

### Response Guidelines:
- ALWAYS use HTML formatting (never plain text)
- ALWAYS include proper indentation with margin-left: 20px
- ALWAYS use <strong> for bold (NEVER use **)
- ALWAYS break content into clear sections
- ALWAYS add spacing between sections
- Be conversational but well-structured
- For general knowledge, still use the same formatting
- Keep responses comprehensive but scannable

Remember: Every single response must follow this exact HTML structure with proper styling and indentation.`

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

    // Generate response using Together AI
    const response = await generateAIResponse(message, history)

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
    return NextResponse.json({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generateAIResponse(message: string, history: any[]): Promise<string> {
  try {
    // Build conversation history for context
    const messages = [
      {
        role: 'system',
        content: SYSTEM_KNOWLEDGE
      }
    ]

    // Add conversation history (last 5 messages for context)
    const recentHistory = history.slice(-5)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    })

    // Call Together AI API
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
        repetition_penalty: 1.1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Together AI API error:', errorText)
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()

    // Extract AI response
    let aiResponse = ''
    if (data.choices && data.choices.length > 0) {
      aiResponse = data.choices[0].message?.content || data.choices[0].text || ''
    }

    if (!aiResponse) {
      throw new Error('Empty response from AI')
    }

    return aiResponse

  } catch (error) {
    console.error('AI generation error:', error)
    // Fallback to basic responses if AI fails
    return getFallbackResponse(message)
  }
}

function getFallbackResponse(message: string): string {
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
  
  if (lowerMessage.includes('message') || lowerMessage.includes('chat')) {
    return "You can send messages to other community members through the 'Messages' section. Select a contact from your list and start chatting. Administrators can also be reached through messages for support."
  }
  
  if (lowerMessage.includes('announcement')) {
    return "Community announcements are posted by administrators and can be viewed in the 'Announcements' section. You'll receive notifications when new announcements are posted."
  }
  
  return "I'm here to help with community-related questions! You can ask me about submitting complaints, voting on polls, providing feedback, sending messages, viewing announcements, or general questions about the community system. What would you like to know?"
}