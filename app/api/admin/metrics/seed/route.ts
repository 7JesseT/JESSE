import { NextRequest, NextResponse } from 'next/server'
import { generateSeedData } from '@/lib/metrics-seed'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Seed endpoint is only available in development' },
        { status: 403 }
      )
    }

    const result = await generateSeedData()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Demo data generated successfully',
        dataGenerated: result.dataGenerated
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Seed data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
