import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { getTransactionById, processRefund } from '@/lib/transactions'
import { getNetworkConfig, NetworkType } from '@/lib/networks'
import { 
  createRefundRequest, 
  getAllRefundRequests, 
  getRefundRequestsByBuyer,
  updateRefundStatus,
  getRefundRequestById 
} from '@/lib/refunds'

const USDC_ADDRESS_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
const USDC_ADDRESS_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_DECIMALS = 6

// USDC ABI for transfer function
const USDC_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

// Get USDC address for network
const getUsdcAddress = (network: NetworkType): string => {
  return network === 'mainnet' ? USDC_ADDRESS_MAINNET : USDC_ADDRESS_SEPOLIA
}

// Get public client for network
const getPublicClientForNetwork = (network: NetworkType) => {
  const chain = network === 'mainnet' ? base : baseSepolia
  return createPublicClient({
    chain,
    transport: http()
  })
}

// Get wallet client for network (for sending refunds)
const getWalletClientForNetwork = (network: NetworkType) => {
  const chain = network === 'mainnet' ? base : baseSepolia
  
  // Get admin private key from environment
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
  if (!adminPrivateKey) {
    throw new Error('ADMIN_PRIVATE_KEY not configured')
  }
  
  const account = privateKeyToAccount(adminPrivateKey as `0x${string}`)
  
  return createWalletClient({
    account,
    chain,
    transport: http()
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buyerAddress = searchParams.get('buyer')
    const adminView = searchParams.get('admin') === 'true'
    
    if (adminView) {
      // Admin view - get all refund requests
      const refundRequests = await getAllRefundRequests()
      return NextResponse.json({ refundRequests })
    } else if (buyerAddress) {
      // Buyer view - get refund requests for specific buyer
      const refundRequests = await getRefundRequestsByBuyer(buyerAddress)
      return NextResponse.json({ refundRequests })
    } else {
      return NextResponse.json(
        { error: 'Missing buyer address or admin flag' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error fetching refund requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refund requests' },
      { status: 500 }
    )
  }
}

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
    
    // Use provided buyer address or default for testing (NO WALLET RESTRICTIONS)
    const buyerWallet = buyerAddress || request.headers.get('x-wallet-address') || '0x1234567890123456789012345678901234567890'
    
    // Get transaction details
    const transaction = await getTransactionById(transactionId)
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    // For testing purposes, skip wallet verification
    // In production, you would verify: transaction.user.toLowerCase() === buyerWallet.toLowerCase()
    
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
          message: `Refund requested for transaction ${transactionId} by ${buyerWallet.slice(0, 6)}...${buyerWallet.slice(-4)}`,
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

export async function PUT(request: NextRequest) {
  try {
    const { refundId, action, adminNotes, network = 'sepolia' } = await request.json()
    
    // Validate required fields
    if (!refundId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: refundId, action' },
        { status: 400 }
      )
    }
    
    // Validate action
    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or deny' },
        { status: 400 }
      )
    }
    
    // Use provided admin wallet or default for testing (NO WALLET RESTRICTIONS)
    const adminWallet = request.headers.get('x-wallet-address') || '0x1234567890123456789012345678901234567890'
    
    // Get refund request
    const refundRequest = await getRefundRequestById(refundId)
    if (!refundRequest) {
      return NextResponse.json(
        { error: 'Refund request not found' },
        { status: 404 }
      )
    }
    
    // Check if already processed
    if (refundRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Refund request has already been processed' },
        { status: 400 }
      )
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'denied'
    
    // Update refund request status
    const updatedRefundRequest = await updateRefundStatus(
      refundId,
      newStatus,
      adminWallet,
      adminNotes
    )
    
    if (!updatedRefundRequest) {
      return NextResponse.json(
        { error: 'Failed to update refund request' },
        { status: 500 }
      )
    }
    
    // If approved, process the actual refund
    if (action === 'approve') {
      try {
        // Get transaction details
        const transaction = await getTransactionById(refundRequest.transactionId)
        if (!transaction) {
          throw new Error('Transaction not found')
        }
        
        // Only process USDC refunds for now
        if (transaction.currency !== 'USDC') {
          throw new Error('Only USDC transactions can be refunded through this endpoint')
    }
    
    // Get network configuration
    const usdcAddress = getUsdcAddress(network as NetworkType)
    
    // Create clients
    const publicClient = getPublicClientForNetwork(network as NetworkType)
    const walletClient = getWalletClientForNetwork(network as NetworkType)
    
    // Check admin wallet USDC balance
    const adminBalance = await publicClient.readContract({
      address: usdcAddress as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [walletClient.account.address]
    })
    
    const refundAmount = parseUnits(transaction.amount.toString(), USDC_DECIMALS)
    
    if (adminBalance < refundAmount) {
          throw new Error('Insufficient USDC balance in admin wallet for refund')
    }
    
    // Send USDC refund
    const refundTxHash = await walletClient.writeContract({
      address: usdcAddress as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'transfer',
          args: [refundRequest.buyer as `0x${string}`, refundAmount]
    })
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: refundTxHash,
      timeout: 60000 // 1 minute timeout
    })
    
    if (receipt.status !== 'success') {
          throw new Error('Refund transaction failed')
    }
    
    // Update transaction status in database
    const updatedTransaction = await processRefund(
          refundRequest.transactionId,
      refundTxHash,
      adminWallet
    )
    
    if (!updatedTransaction) {
          throw new Error('Failed to update transaction status')
    }

    // Trigger notification for successful refund
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'success',
          category: 'refund',
          title: 'Refund Processed',
              message: `💸 Refund of ${transaction.amount} ${transaction.currency} processed successfully for ${refundRequest.buyer.slice(0, 6)}...${refundRequest.buyer.slice(-4)}`,
          autoDismiss: true,
          dismissAfter: 5000,
        }),
      });
    } catch (notificationError) {
      console.error('Failed to send refund notification:', notificationError);
    }
    
    return NextResponse.json({
      success: true,
          refundRequest: updatedRefundRequest,
      refundTxHash,
      transaction: updatedTransaction
    })
    
      } catch (refundError) {
        console.error('Refund processing error:', refundError)
        
        // Revert refund request status if refund failed
        await updateRefundStatus(refundId, 'pending', adminWallet, `Refund failed: ${refundError instanceof Error ? refundError.message : 'Unknown error'}`)
        
        return NextResponse.json(
          { error: `Refund processing failed: ${refundError instanceof Error ? refundError.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    } else {
      // Refund denied - just update status
      // Trigger notification for denied refund
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'warning',
            category: 'refund',
            title: 'Refund Request Denied',
            message: `Refund request denied for ${refundRequest.buyer.slice(0, 6)}...${refundRequest.buyer.slice(-4)}`,
            autoDismiss: true,
            dismissAfter: 7000,
          }),
        });
      } catch (notificationError) {
        console.error('Failed to send refund denial notification:', notificationError);
      }
      
      return NextResponse.json({
        success: true,
        refundRequest: updatedRefundRequest
      })
    }
    
  } catch (error) {
    console.error('Refund processing error:', error)
    
    return NextResponse.json(
      { error: 'Failed to process refund request' },
      { status: 500 }
    )
  }
}