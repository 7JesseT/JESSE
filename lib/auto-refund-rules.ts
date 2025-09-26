import { RefundRequest } from './refunds'
import { Transaction } from './transactions'
import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { getNetworkConfig, NetworkType } from './networks'

// Auto-refund rule configuration
export interface AutoRefundRule {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: AutoRefundCondition[]
  priority: number
}

export interface AutoRefundCondition {
  type: 'transaction_failed' | 'mint_reverted' | 'evidence_tag' | 'duplicate_transaction' | 'delivery_failed'
  operator: 'equals' | 'contains' | 'exists' | 'not_exists'
  value?: string | string[]
  weight: number // 0-100, higher weight = more likely to auto-refund
}

// Default auto-refund rules
export const DEFAULT_AUTO_REFUND_RULES: AutoRefundRule[] = [
  {
    id: 'duplicate_evidence',
    name: 'Duplicate Purchase Evidence',
    description: 'Auto-refund when buyer provides evidence tagged as "duplicate"',
    enabled: true,
    conditions: [
      {
        type: 'evidence_tag',
        operator: 'contains',
        value: 'duplicate',
        weight: 90
      }
    ],
    priority: 1
  },
  {
    id: 'failed_delivery_evidence',
    name: 'Failed Delivery Evidence',
    description: 'Auto-refund when buyer provides evidence of failed delivery',
    enabled: true,
    conditions: [
      {
        type: 'evidence_tag',
        operator: 'contains',
        value: 'failed_delivery',
        weight: 85
      }
    ],
    priority: 2
  },
  {
    id: 'transaction_failed',
    name: 'Transaction Failed',
    description: 'Auto-refund when the original transaction failed on-chain',
    enabled: true,
    conditions: [
      {
        type: 'transaction_failed',
        operator: 'equals',
        value: 'true',
        weight: 95
      }
    ],
    priority: 3
  },
  {
    id: 'mint_reverted',
    name: 'Mint Transaction Reverted',
    description: 'Auto-refund when NFT mint transaction reverted',
    enabled: true,
    conditions: [
      {
        type: 'mint_reverted',
        operator: 'equals',
        value: 'true',
        weight: 95
      }
    ],
    priority: 4
  }
]

// Get public client for network
const getPublicClientForNetwork = (network: NetworkType) => {
  const chain = network === 'mainnet' ? base : baseSepolia
  return createPublicClient({
    chain,
    transport: http()
  })
}

// Check if transaction failed on-chain
export const checkTransactionFailed = async (
  transaction: Transaction,
  network: NetworkType = 'sepolia'
): Promise<boolean> => {
  try {
    if (!transaction.txHash || transaction.txHash === 'demo-mode') {
      return false // Skip demo transactions
    }

    const publicClient = getPublicClientForNetwork(network)
    
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: transaction.txHash as `0x${string}`
    })

    return receipt.status === 'reverted'
  } catch (error) {
    console.error('Error checking transaction status:', error)
    return false
  }
}

// Check if mint transaction reverted
export const checkMintReverted = async (
  transaction: Transaction,
  network: NetworkType = 'sepolia'
): Promise<boolean> => {
  try {
    if (transaction.type !== 'nft_purchase' || !transaction.txHash || transaction.txHash === 'demo-mode') {
      return false
    }

    const publicClient = getPublicClientForNetwork(network)
    
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: transaction.txHash as `0x${string}`
    })

    return receipt.status === 'reverted'
  } catch (error) {
    console.error('Error checking mint transaction status:', error)
    return false
  }
}

// Check if evidence contains specific tags
export const checkEvidenceTags = (
  refundRequest: RefundRequest,
  requiredTags: string[]
): boolean => {
  if (!refundRequest.evidence || refundRequest.evidence.length === 0) {
    return false
  }

  const allTags = refundRequest.evidence.flatMap(evidence => evidence.tags || [])
  return requiredTags.some(tag => allTags.includes(tag))
}

// Check if transaction is a duplicate
export const checkDuplicateTransaction = async (
  refundRequest: RefundRequest,
  transaction: Transaction
): Promise<boolean> => {
  try {
    // This would typically check against a database of transactions
    // For now, we'll use a simple heuristic based on the reason
    return refundRequest.reason.toLowerCase().includes('duplicate')
  } catch (error) {
    console.error('Error checking duplicate transaction:', error)
    return false
  }
}

// Evaluate a single condition
export const evaluateCondition = async (
  condition: AutoRefundCondition,
  refundRequest: RefundRequest,
  transaction: Transaction,
  network: NetworkType = 'sepolia'
): Promise<{ matched: boolean; weight: number }> => {
  let matched = false

  switch (condition.type) {
    case 'transaction_failed':
      matched = await checkTransactionFailed(transaction, network)
      break

    case 'mint_reverted':
      matched = await checkMintReverted(transaction, network)
      break

    case 'evidence_tag':
      if (Array.isArray(condition.value)) {
        matched = checkEvidenceTags(refundRequest, condition.value)
      } else if (typeof condition.value === 'string') {
        matched = checkEvidenceTags(refundRequest, [condition.value])
      }
      break

    case 'duplicate_transaction':
      matched = await checkDuplicateTransaction(refundRequest, transaction)
      break

    case 'delivery_failed':
      // This would typically integrate with shipping/delivery APIs
      // For now, we'll check evidence tags
      matched = checkEvidenceTags(refundRequest, ['failed_delivery', 'delivery_issue'])
      break

    default:
      matched = false
  }

  return {
    matched,
    weight: matched ? condition.weight : 0
  }
}

// Evaluate all rules for a refund request
export const evaluateAutoRefundRules = async (
  refundRequest: RefundRequest,
  transaction: Transaction,
  rules: AutoRefundRule[] = DEFAULT_AUTO_REFUND_RULES,
  network: NetworkType = 'sepolia',
  threshold: number = 80 // Minimum weight threshold for auto-refund
): Promise<{
  eligible: boolean
  totalWeight: number
  matchedRules: string[]
  details: Array<{
    ruleId: string
    ruleName: string
    matched: boolean
    weight: number
    conditions: Array<{
      type: string
      matched: boolean
      weight: number
    }>
  }>
}> => {
  const results = []
  let totalWeight = 0
  const matchedRules: string[] = []

  // Sort rules by priority
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority)

  for (const rule of sortedRules) {
    if (!rule.enabled) continue

    const ruleResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: false,
      weight: 0,
      conditions: [] as Array<{
        type: string
        matched: boolean
        weight: number
      }>
    }

    let ruleWeight = 0
    let ruleMatched = true

    // Evaluate all conditions in the rule
    for (const condition of rule.conditions) {
      const conditionResult = await evaluateCondition(condition, refundRequest, transaction, network)
      
      ruleResult.conditions.push({
        type: condition.type,
        matched: conditionResult.matched,
        weight: conditionResult.weight
      })

      if (conditionResult.matched) {
        ruleWeight += conditionResult.weight
      } else {
        // If any condition fails, the rule doesn't match
        ruleMatched = false
      }
    }

    ruleResult.matched = ruleMatched
    ruleResult.weight = ruleMatched ? ruleWeight : 0

    if (ruleMatched) {
      totalWeight += ruleWeight
      matchedRules.push(rule.id)
    }

    results.push(ruleResult)
  }

  return {
    eligible: totalWeight >= threshold,
    totalWeight,
    matchedRules,
    details: results
  }
}

// Get auto-refund recommendation
export const getAutoRefundRecommendation = async (
  refundRequest: RefundRequest,
  transaction: Transaction,
  network: NetworkType = 'sepolia'
): Promise<{
  recommended: boolean
  confidence: number
  reason: string
  details: any
}> => {
  const evaluation = await evaluateAutoRefundRules(refundRequest, transaction, DEFAULT_AUTO_REFUND_RULES, network)

  if (evaluation.eligible) {
    return {
      recommended: true,
      confidence: Math.min(evaluation.totalWeight, 100),
      reason: `Auto-refund recommended based on ${evaluation.matchedRules.length} matching rule(s)`,
      details: evaluation
    }
  } else {
    return {
      recommended: false,
      confidence: evaluation.totalWeight,
      reason: `Insufficient evidence for auto-refund (${evaluation.totalWeight}% confidence)`,
      details: evaluation
    }
  }
}
