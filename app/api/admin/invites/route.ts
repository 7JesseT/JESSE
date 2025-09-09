import { NextRequest, NextResponse } from 'next/server'
import { getAllInvites, exportInvitesToCsv } from '@/lib/invites'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY
    if (!adminKey) {
      return NextResponse.json({ error: 'Admin key not configured' }, { status: 500 })
    }

    const url = new URL(request.url)
    const providedKey = url.searchParams.get('adminKey')
    
    if (providedKey !== adminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invites = getAllInvites()
    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Error fetching invites:', error)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY
    if (!adminKey) {
      return NextResponse.json({ error: 'Admin key not configured' }, { status: 500 })
    }

    const url = new URL(request.url)
    const providedKey = url.searchParams.get('adminKey')
    
    if (providedKey !== adminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'export') {
      const csv = exportInvitesToCsv()
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="invites.csv"'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in admin invites API:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
