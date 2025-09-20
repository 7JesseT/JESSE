import { NextRequest, NextResponse } from 'next/server'
import { updateTransactionStatus } from '@/lib/transactions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { status } = await request.json()
    
    // Get the wallet address from the request headers or body
    const walletAddress = request.headers.get('x-wallet-address')
    
    // Allow any wallet to update transaction status (removed admin restriction)
    // Note: In production, you may want to add back admin verification
    
    if (!status || !['pending', 'confirmed', 'shipped', 'delivered', 'refunded'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    
    const updatedTransaction = await updateTransactionStatus(id, status as any)
    
    if (!updatedTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, transaction: updatedTransaction })
  } catch (error) {
    console.error('Error updating transaction status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
