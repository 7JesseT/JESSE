import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { getTransactionById, processRefund } from '@/lib/transactions'
import { getNetworkConfig, NetworkType } from '@/lib/networks'
import { 
  updateRefundStatus,
  getRefundRequestById 
} from '@/lib/refunds'
import { erc1155Abi } from '@/lib/contracts'

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
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
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

// Get wallet client for network (for sending refunds and burning NFTs)
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

export async function POST(request: NextRequest) {
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
    
    // Use provided admin wallet or default for testing
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
        
        // Get network configuration
        const usdcAddress = getUsdcAddress(network as NetworkType)
        
        // Create clients
        const publicClient = getPublicClientForNetwork(network as NetworkType)
        const walletClient = getWalletClientForNetwork(network as NetworkType)
        
        let refundTxHash: string | undefined
        let burnTxHash: string | undefined
        
        // Process USDC refund if applicable
        if (transaction.currency === 'USDC') {
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
          refundTxHash = await walletClient.writeContract({
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
        }
        
        // Process NFT burning if applicable
        if (transaction.type === 'nft_purchase' && transaction.metadata?.contractAddress && transaction.metadata?.tokenId) {
          const contractAddress = transaction.metadata.contractAddress as `0x${string}`
          const tokenId = BigInt(transaction.metadata.tokenId)
          const tokenAmount = transaction.metadata.tokenAmount || 1
          
          // Check if the buyer has the NFT
          const nftBalance = await publicClient.readContract({
            address: contractAddress,
            abi: erc1155Abi,
            functionName: 'balanceOf',
            args: [refundRequest.buyer as `0x${string}`, tokenId]
          })
          
          if (nftBalance < BigInt(tokenAmount)) {
            throw new Error(`Buyer does not have enough NFTs to burn. Balance: ${nftBalance}, Required: ${tokenAmount}`)
          }
          
          // Burn the NFT
          burnTxHash = await walletClient.writeContract({
            address: contractAddress,
            abi: erc1155Abi,
            functionName: 'burn',
            args: [refundRequest.buyer as `0x${string}`, tokenId, BigInt(tokenAmount)]
          })
          
          // Wait for burn transaction confirmation
          const burnReceipt = await publicClient.waitForTransactionReceipt({
            hash: burnTxHash,
            timeout: 60000 // 1 minute timeout
          })
          
          if (burnReceipt.status !== 'success') {
            throw new Error('NFT burn transaction failed')
          }
        }
        
        // Update transaction status in database
        const updatedTransaction = await processRefund(
          refundRequest.transactionId,
          refundTxHash || burnTxHash || 'no-tx-hash',
          adminWallet
        )
        
        if (!updatedTransaction) {
          throw new Error('Failed to update transaction status')
        }

        // Create audit log for refund processed
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'refund_processed',
              actor: adminWallet,
              user: refundRequest.buyer,
              details: {
                refundId,
                transactionId: refundRequest.transactionId,
                refundTxHash,
                burnTxHash,
                amount: transaction.amount,
                currency: transaction.currency,
                transactionType: transaction.type,
                adminNotes
              },
              metadata: `Refund processed: ${transaction.amount} ${transaction.currency} to ${refundRequest.buyer}${burnTxHash ? ' + NFT burned' : ''}`
            })
          });
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError);
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
              message: `💸 Refund of ${transaction.amount} ${transaction.currency} processed successfully for ${refundRequest.buyer.slice(0, 6)}...${refundRequest.buyer.slice(-4)}${burnTxHash ? ' 🔥 NFT burned' : ''}`,
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
          burnTxHash,
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
