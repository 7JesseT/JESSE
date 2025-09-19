import { NextRequest, NextResponse } from 'next/server'
import { isAdminWallet } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    
    if (!walletAddress) {
      return NextResponse.json({ isAdmin: false, error: 'Wallet address required' }, { status: 400 })
    }
    
    const isAdmin = isAdminWallet(walletAddress)
    
    return NextResponse.json({ 
      isAdmin,
      wallet: walletAddress 
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false, error: 'Internal server error' }, { status: 500 })
  }
}
