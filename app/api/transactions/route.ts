import { NextRequest, NextResponse } from 'next/server'
import { getTransactionsByUser, getAllTransactions, updateTransactionStatus, TransactionStatus } from '@/lib/transactions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('user')
    
    if (userAddress) {
      // Get transactions for specific user
      const transactions = await getTransactionsByUser(userAddress)
      return NextResponse.json({ transactions })
    } else {
      // Get all transactions (admin only - in production, add admin auth check)
      const transactions = await getAllTransactions()
      return NextResponse.json({ transactions })
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, status } = await request.json()
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Transaction ID and status are required' },
        { status: 400 }
      )
    }
    
    // Validate status
    const validStatuses: TransactionStatus[] = ['pending', 'confirmed', 'shipped']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, confirmed, shipped' },
        { status: 400 }
      )
    }
    
    // Update transaction status
    const updatedTransaction = await updateTransactionStatus(id, status)
    
    if (!updatedTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      transaction: updatedTransaction
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}
