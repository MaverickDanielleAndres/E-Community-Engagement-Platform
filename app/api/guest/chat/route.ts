// @/app/api/guest/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Generate intelligent response for guests
    const response = await generateGuestChatResponse(message, history)

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Guest chat error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

async function generateGuestChatResponse(message: string, history: any[] = []): Promise<string> {
  const lowerMessage = message.toLowerCase().trim()

  // Community and membership questions
  if (lowerMessage.includes('join') || lowerMessage.includes('membership') || lowerMessage.includes('member')) {
    if (lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return "To join our community, you'll need a community access code from your local administrator. Visit the 'Join Community' section to enter your code and complete the verification process. This includes email verification, ID verification, and admin approval."
    }
    if (lowerMessage.includes('benefit') || lowerMessage.includes('advantage')) {
      return "As a community member, you'll have access to: voting on community polls, submitting and tracking complaints, providing feedback, receiving notifications, accessing community analytics, and participating in community discussions."
    }
    return "Joining our community requires an access code from your local administrator. Once you have the code, you can sign up, verify your email, submit ID verification, and wait for admin approval."
  }

  // Verification and approval questions
  if (lowerMessage.includes('verification') || lowerMessage.includes('verify') || lowerMessage.includes('approval') || lowerMessage.includes('pending')) {
    if (lowerMessage.includes('status') || lowerMessage.includes('check')) {
      return "You can check your verification status in the 'Verification Status' section. Your application goes through: email verification → ID verification → admin review → approval. This typically takes 1-2 business days."
    }
    if (lowerMessage.includes('long') || lowerMessage.includes('time') || lowerMessage.includes('how long')) {
      return "The verification process usually takes 1-2 business days. Email verification is instant, ID verification is reviewed by admins, and final approval depends on admin availability."
    }
    if (lowerMessage.includes('remind') || lowerMessage.includes('follow up')) {
      return "You can send a reminder to admins if your verification is taking longer than expected. There's a 2-hour cooldown between reminders to avoid spam."
    }
    return "Our verification process ensures community safety and authenticity. It includes email verification, government ID submission, and admin review. You can track your status and send reminders if needed."
  }

  // Voting and polls questions
  if (lowerMessage.includes('vote') || lowerMessage.includes('poll') || lowerMessage.includes('voting')) {
    if (lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return "Community voting allows members to participate in important decisions. You can vote on active polls, view real-time results, and see voting history. Polls cover community policies, budget decisions, and governance matters."
    }
    if (lowerMessage.includes('create') || lowerMessage.includes('make')) {
      return "Only administrators can create polls. They design questions, set options, and determine voting periods. Members can participate in active polls and view results."
    }
    if (lowerMessage.includes('result') || lowerMessage.includes('outcome')) {
      return "Poll results are displayed in real-time charts showing vote distribution. You can see both current active polls and historical results. Results help inform community decisions."
    }
    return "Our voting system enables democratic community decision-making. Members can vote on polls created by admins, with results displayed in real-time. Explore polls to see current community discussions."
  }

  // Complaints questions
  if (lowerMessage.includes('complaint') || lowerMessage.includes('report') || lowerMessage.includes('issue')) {
    if (lowerMessage.includes('submit') || lowerMessage.includes('file')) {
      return "Members can submit complaints through the 'Complaints' section. Choose a category (Maintenance, Governance, or Other), provide detailed information, and optionally add images. Complaints are tracked and responded to by administrators."
    }
    if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
      return "You can track your complaint status in 'My Complaints'. See updates, admin responses, and resolution progress. Complaints go through: Submitted → Under Review → In Progress → Resolved."
    }
    if (lowerMessage.includes('category') || lowerMessage.includes('type')) {
      return "Complaints are categorized as: Maintenance (building/facility issues), Governance (policy/rule concerns), or Other (general feedback). Proper categorization helps admins respond efficiently."
    }
    return "Our complaint system allows members to report issues and track resolutions. Submit detailed complaints with evidence, and admins will investigate and respond. All complaints are confidential and tracked."
  }

  // Feedback questions
  if (lowerMessage.includes('feedback') || lowerMessage.includes('rating') || lowerMessage.includes('review')) {
    if (lowerMessage.includes('give') || lowerMessage.includes('submit')) {
      return "You can provide feedback in the 'Feedback' section. Rate your experience from 1-5 stars and optionally add comments. Your feedback helps improve community services and is reviewed by administrators."
    }
    if (lowerMessage.includes('see') || lowerMessage.includes('view')) {
      return "Members can view their submitted feedback in 'My Feedback'. Admins can see aggregated feedback analytics to identify trends and improvement areas."
    }
    return "Feedback helps us improve the community platform. Members can rate their experience and provide comments. This valuable input guides our development and service improvements."
  }

  // Admin and support questions
  if (lowerMessage.includes('admin') || lowerMessage.includes('administrator') || lowerMessage.includes('support')) {
    if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
      return "You can contact administrators through the complaint system for urgent issues, or use the reminder feature for verification delays. Admins monitor the platform and respond to community needs."
    }
    if (lowerMessage.includes('who') || lowerMessage.includes('identify')) {
      return "Administrators are identified by their role badges and have access to management features. They handle verifications, complaints, polls, and community oversight."
    }
    return "Administrators manage community operations, review verifications, handle complaints, and create polls. They ensure smooth platform operation and community engagement."
  }

  // Services and features questions
  if (lowerMessage.includes('service') || lowerMessage.includes('feature') || lowerMessage.includes('what can')) {
    return "Our platform offers: Community voting and polls, complaint submission and tracking, feedback collection, notifications, analytics dashboard, member management, and AI-powered assistance. Full access requires membership approval."
  }

  // General community questions
  if (lowerMessage.includes('community') || lowerMessage.includes('about') || lowerMessage.includes('what is')) {
    return "This is a community management platform that enables democratic decision-making, issue tracking, and member engagement. We focus on transparency, participation, and efficient community governance."
  }

  // Help and getting started questions
  if (lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('start')) {
    return "To get started: 1) Get a community access code from your administrator, 2) Sign up and verify your email, 3) Complete ID verification, 4) Wait for admin approval, 5) Start participating in polls, complaints, and feedback. I'm here to help with any questions!"
  }

  // Greeting and general conversation
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm EComAI, your community assistant. I can help answer questions about joining the community, verification process, voting, complaints, feedback, and general platform features. What would you like to know?"
  }

  // Thank you responses
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return "You're welcome! I'm here to help with any community-related questions. Feel free to ask about membership, features, or how anything works."
  }

  // Default response with suggestions
  const suggestions = [
    "Ask me about joining the community",
    "Learn about the verification process",
    "Understand how voting works",
    "Get help with complaints",
    "Learn about feedback features"
  ]

  return `I can help with many community-related questions! Here are some things I can assist with:\n\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nWhat would you like to know more about?`
}
