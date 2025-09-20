import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    
    if (!walletAddress) {
      return NextResponse.json({ isAdmin: false, error: 'Wallet address required' }, { status: 400 })
    }
    
    // Allow any wallet to access admin dashboard
    const isAdmin = true
    
    return NextResponse.json({ 
      isAdmin,
      wallet: walletAddress 
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false, error: 'Internal server error' }, { status: 500 })
  }
}
