// app/api/debug/session/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  return NextResponse.json({ session, timestamp: new Date().toISOString() })
}