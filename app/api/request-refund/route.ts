import { NextRequest, NextResponse } from 'next/server'
import { createRefundRequest } from '@/lib/refunds'
import { getTransactionById } from '@/lib/transactions'

export async function POST(request: NextRequest) {
  try {
    const { transactionId, reason, buyerAddress } = await request.json()
    
    // Validate required fields
    if (!transactionId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, reason' },
        { status: 400 }
      )
    }
    
    // Use provided buyer address or default for testing
    const buyerWallet = buyerAddress || request.headers.get('x-wallet-address') || '0x1234567890123456789012345678901234567890'
    
    // Get transaction details
    const transaction = await getTransactionById(transactionId)
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    // Check if transaction is eligible for refund request
    if (transaction.status === 'refunded') {
      return NextResponse.json(
        { error: 'Transaction has already been refunded' },
        { status: 400 }
      )
    }
    
    if (transaction.status === 'pending') {
      return NextResponse.json(
        { error: 'Cannot request refund for pending transactions' },
        { status: 400 }
      )
    }
    
    // Create refund request
    const refundRequest = await createRefundRequest(transactionId, buyerWallet, reason)
    
    // Create audit log for refund request
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'refund_request',
          actor: buyerWallet,
          user: buyerWallet,
          details: {
            refundId: refundRequest.id,
            transactionId,
            reason,
            amount: transaction.amount,
            currency: transaction.currency,
            transactionType: transaction.type
          },
          metadata: `Refund request for ${transaction.type} transaction ${transactionId}: ${reason}`
        })
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }
    
    // Trigger notification for buyer about refund request submission
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'info',
          category: 'refund',
          title: 'Refund Request Submitted',
          message: 'Your refund request has been submitted and is under review.',
          autoDismiss: true,
          dismissAfter: 5000,
        }),
      });
    } catch (notificationError) {
      console.error('Failed to send buyer notification:', notificationError);
    }
    
    // Trigger notification for admin about new refund request
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'warning',
          category: 'admin',
          title: 'New Refund Request',
          message: `Refund requested for ${transaction.type} transaction ${transactionId} by ${buyerWallet.slice(0, 6)}...${buyerWallet.slice(-4)}`,
          autoDismiss: false,
        }),
      });
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError);
    }
    
    return NextResponse.json({
      success: true,
      refundRequest
    })
    
  } catch (error) {
    console.error('Refund request error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create refund request' },
      { status: 500 }
    )
  }
}
