import { NextRequest, NextResponse } from 'next/server'
import { createTransaction, Transaction } from '@/lib/transactions'

export async function POST(request: NextRequest) {
  try {
    const transactionData = await request.json()
    
    // Validate required fields
    const { user, amount, currency, type, status, timestamp, txHash, metadata } = transactionData
    
    if (!user || !amount || !currency || !type || !status || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: user, amount, currency, type, status, timestamp' },
        { status: 400 }
      )
    }
    
    // Validate currency
    if (!['ETH', 'USDC'].includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency. Must be ETH or USDC' },
        { status: 400 }
      )
    }
    
    // Validate type
    if (!['tip', 'nft_mint', 'file_purchase', 'special_reward'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: tip, nft_mint, file_purchase, special_reward' },
        { status: 400 }
      )
    }
    
    // Validate status
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'refunded'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, confirmed, shipped, delivered, refunded' },
        { status: 400 }
      )
    }
    
    // Create transaction
    const transaction = await createTransaction({
      user,
      amount: Number(amount),
      currency,
      type,
      status,
      timestamp,
      txHash,
      metadata
    })
    
    return NextResponse.json({
      success: true,
      transaction
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
