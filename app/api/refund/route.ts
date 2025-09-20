import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { getTransactionById, processRefund } from '@/lib/transactions'
import { getNetworkConfig, NetworkType } from '@/lib/networks'

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

export async function POST(request: NextRequest) {
  try {
    const { transactionId, buyerAddress, network = 'sepolia' } = await request.json()
    
    // Validate required fields
    if (!transactionId || !buyerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, buyerAddress' },
        { status: 400 }
      )
    }
    
    // Validate network
    if (!['mainnet', 'sepolia'].includes(network)) {
      return NextResponse.json(
        { error: 'Invalid network. Must be mainnet or sepolia' },
        { status: 400 }
      )
    }
    
    // Get admin wallet from request headers
    const adminWallet = request.headers.get('x-wallet-address')
    if (!adminWallet) {
      return NextResponse.json(
        { error: 'Admin wallet address required' },
        { status: 401 }
      )
    }
    
    // Allow any wallet to process refunds (removed admin restriction)
    // Note: In production, you may want to add back admin verification
    
    // Get transaction details
    const transaction = await getTransactionById(transactionId)
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    // Verify buyer is the original payer
    if (transaction.user.toLowerCase() !== buyerAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Buyer address does not match transaction payer' },
        { status: 400 }
      )
    }
    
    // Only allow refunds for USDC transactions (ETH refunds would require different logic)
    if (transaction.currency !== 'USDC') {
      return NextResponse.json(
        { error: 'Only USDC transactions can be refunded through this endpoint' },
        { status: 400 }
      )
    }
    
    // Check if transaction is eligible for refund
    if (transaction.status === 'refunded') {
      return NextResponse.json(
        { error: 'Transaction has already been refunded' },
        { status: 400 }
      )
    }
    
    if (transaction.status === 'pending') {
      return NextResponse.json(
        { error: 'Cannot refund pending transactions' },
        { status: 400 }
      )
    }
    
    // Get network configuration
    const networkConfig = getNetworkConfig(network as NetworkType)
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
      return NextResponse.json(
        { error: 'Insufficient USDC balance in admin wallet for refund' },
        { status: 400 }
      )
    }
    
    // Send USDC refund
    const refundTxHash = await walletClient.writeContract({
      address: usdcAddress as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [buyerAddress as `0x${string}`, refundAmount]
    })
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: refundTxHash,
      timeout: 60000 // 1 minute timeout
    })
    
    if (receipt.status !== 'success') {
      return NextResponse.json(
        { error: 'Refund transaction failed' },
        { status: 500 }
      )
    }
    
    // Update transaction status in database
    const updatedTransaction = await processRefund(
      transactionId,
      refundTxHash,
      adminWallet
    )
    
    if (!updatedTransaction) {
      return NextResponse.json(
        { error: 'Failed to update transaction status' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      refundTxHash,
      refundAmount: transaction.amount,
      currency: transaction.currency,
      transaction: updatedTransaction
    })
    
  } catch (error) {
    console.error('Refund error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return NextResponse.json(
          { error: 'Insufficient funds for refund transaction' },
          { status: 400 }
        )
      }
      if (error.message.includes('user rejected')) {
        return NextResponse.json(
          { error: 'Transaction rejected by user' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}
