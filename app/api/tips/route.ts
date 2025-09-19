import { NextRequest, NextResponse } from 'next/server'
import { getAllTotals, getRecentTransactions } from '@/lib/tips-tracking'

export async function GET(request: NextRequest) {
  try {
    const totals = getAllTotals()
    const recentTransactions = getRecentTransactions(50)
    
    return NextResponse.json({
      totals,
      transactions: recentTransactions
    })
  } catch (error) {
    console.error('Error fetching tips data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
