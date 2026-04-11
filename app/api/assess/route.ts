import { NextRequest, NextResponse } from 'next/server'
import { assessAISystem, type AISystemInput } from '@/lib/anthropic'

export async function POST(request: NextRequest) {
  try {
    const body: AISystemInput = await request.json()

    if (!body.name || !body.description || !body.purpose || !body.sector) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, purpose, sector' },
        { status: 400 }
      )
    }

    const result = await assessAISystem(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Assessment error:', error)
    return NextResponse.json(
      { error: 'Assessment failed. Please try again.' },
      { status: 500 }
    )
  }
}
