import { NextRequest, NextResponse } from 'next/server'
import { createRefundRequest } from '@/lib/refunds'
import { getTransactionById } from '@/lib/transactions'

export async function POST(request: NextRequest) {
  try {
    const { transactionId, reason, buyerAddress, evidence } = await request.json()
    
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
    
    // Create refund request with optional evidence
    const refundRequest = await createRefundRequest(transactionId, buyerWallet, reason, evidence)
    
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
      const notificationTitle = refundRequest.status === 'under_review' 
        ? 'Refund Request Under Review' 
        : 'Refund Request Submitted'
      const notificationMessage = refundRequest.status === 'under_review'
        ? 'Your refund request with evidence has been submitted and is now under review.'
        : 'Your refund request has been submitted and is pending review.'
        
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'info',
          category: 'refund',
          title: notificationTitle,
          message: notificationMessage,
          autoDismiss: true,
          dismissAfter: 5000,
        }),
      });
    } catch (notificationError) {
      console.error('Failed to send buyer notification:', notificationError);
    }
    
    // Trigger notification for admin about new refund request
    try {
      const adminTitle = refundRequest.status === 'under_review' 
        ? 'New Refund Request - Under Review' 
        : 'New Refund Request - Pending'
      const adminMessage = refundRequest.status === 'under_review'
        ? `🔍 Refund with evidence for ${transaction.type} (${transaction.amount} ${transaction.currency}) by ${buyerWallet.slice(0, 6)}...${buyerWallet.slice(-4)} - Evidence provided, under review`
        : `📋 New refund request for ${transaction.type} (${transaction.amount} ${transaction.currency}) by ${buyerWallet.slice(0, 6)}...${buyerWallet.slice(-4)} - Pending review`
        
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'warning',
          category: 'admin',
          title: adminTitle,
          message: adminMessage,
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
