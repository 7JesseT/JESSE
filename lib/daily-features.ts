/**
 * Daily Features System
 * 
 * Manages daily feature shipping and automatic transaction processing
 * Ensures 1 new feature is shipped + 1 transaction is processed each day
 */

import { 
  loadDailyFeatures, 
  saveDailyFeatures, 
  shouldShipFeatureToday, 
  shouldProcessTransactionToday,
  markFeatureShippedToday,
  markTransactionProcessedToday,
  getTodayString,
  type DailyFeatureData 
} from './wallet-persistence'

export interface DailyFeature {
  id: string
  title: string
  description: string
  category: 'ui' | 'functionality' | 'integration' | 'optimization'
  shippedAt: string
  version: string
}

export interface DailyTransaction {
  id: string
  type: 'tip' | 'mint' | 'paywall' | 'feature'
  amount?: string
  description: string
  processedAt: string
  txHash?: string
}

// Predefined features that can be shipped daily
const AVAILABLE_FEATURES: Omit<DailyFeature, 'shippedAt' | 'version'>[] = [
  {
    id: 'dark-mode-toggle',
    title: 'Dark Mode Toggle',
    description: 'Added a sleek dark mode toggle in the header for better user experience',
    category: 'ui'
  },
  {
    id: 'wallet-balance-display',
    title: 'Enhanced Wallet Balance',
    description: 'Improved wallet balance display with better formatting and real-time updates',
    category: 'ui'
  },
  {
    id: 'transaction-history',
    title: 'Transaction History',
    description: 'Added transaction history tracking for better user insights',
    category: 'functionality'
  },
  {
    id: 'gas-optimization',
    title: 'Gas Fee Optimization',
    description: 'Optimized gas fees for all transactions to reduce costs',
    category: 'optimization'
  },
  {
    id: 'mobile-responsive',
    title: 'Mobile Responsiveness',
    description: 'Enhanced mobile responsiveness across all components',
    category: 'ui'
  },
  {
    id: 'error-handling',
    title: 'Better Error Handling',
    description: 'Improved error handling and user feedback for failed transactions',
    category: 'functionality'
  },
  {
    id: 'loading-states',
    title: 'Loading States',
    description: 'Added smooth loading states for better user experience',
    category: 'ui'
  },
  {
    id: 'wallet-connect-v2',
    title: 'WalletConnect v2 Support',
    description: 'Upgraded to WalletConnect v2 for better mobile wallet support',
    category: 'integration'
  },
  {
    id: 'auto-connect',
    title: 'Auto-Connect Feature',
    description: 'Implemented automatic wallet reconnection for seamless user experience',
    category: 'functionality'
  },
  {
    id: 'daily-features',
    title: 'Daily Features System',
    description: 'Built a system to ship new features and process transactions daily',
    category: 'functionality'
  }
]

/**
 * Get a random feature to ship today
 * @returns A random feature from the available features list
 */
export function getRandomFeature(): DailyFeature {
  const randomIndex = Math.floor(Math.random() * AVAILABLE_FEATURES.length)
  const baseFeature = AVAILABLE_FEATURES[randomIndex]
  const today = getTodayString()
  
  return {
    ...baseFeature,
    shippedAt: today,
    version: `v1.${Date.now().toString().slice(-4)}`
  }
}

/**
 * Get a random transaction to process today
 * @returns A random transaction configuration
 */
export function getRandomTransaction(): DailyTransaction {
  const transactionTypes: DailyTransaction['type'][] = ['tip', 'mint', 'paywall', 'feature']
  const randomType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
  const today = getTodayString()
  
  const transactionDescriptions = {
    tip: 'Daily tip to support the platform development',
    mint: 'Daily attendance NFT mint for active users',
    paywall: 'Daily premium content access payment',
    feature: 'Daily feature deployment transaction'
  }
  
  return {
    id: `daily-${randomType}-${Date.now()}`,
    type: randomType,
    amount: randomType === 'tip' ? '0.001' : randomType === 'paywall' ? '0.005' : undefined,
    description: transactionDescriptions[randomType],
    processedAt: today
  }
}

/**
 * Check if we need to ship a feature today and return it
 * @returns The feature to ship today, or null if already shipped
 */
export function getFeatureToShipToday(): DailyFeature | null {
  if (!shouldShipFeatureToday()) {
    return null
  }
  
  return getRandomFeature()
}

/**
 * Check if we need to process a transaction today and return it
 * @returns The transaction to process today, or null if already processed
 */
export function getTransactionToProcessToday(): DailyTransaction | null {
  if (!shouldProcessTransactionToday()) {
    return null
  }
  
  return getRandomTransaction()
}

/**
 * Mark that a feature was successfully shipped today
 * @param feature - The feature that was shipped
 */
export function markFeatureAsShipped(feature: DailyFeature): void {
  markFeatureShippedToday()
  console.log('Feature shipped:', feature.title)
}

/**
 * Mark that a transaction was successfully processed today
 * @param transaction - The transaction that was processed
 * @param txHash - Optional transaction hash
 */
export function markTransactionAsProcessed(transaction: DailyTransaction, txHash?: string): void {
  markTransactionProcessedToday()
  console.log('Transaction processed:', transaction.description, txHash ? `(${txHash})` : '')
}

/**
 * Get today's daily status
 * @returns Object containing today's feature and transaction status
 */
export function getTodayStatus(): {
  featureShipped: boolean
  transactionProcessed: boolean
  featureToShip: DailyFeature | null
  transactionToProcess: DailyTransaction | null
} {
  const featureToShip = getFeatureToShipToday()
  const transactionToProcess = getTransactionToProcessToday()
  
  return {
    featureShipped: !featureToShip,
    transactionProcessed: !transactionToProcess,
    featureToShip,
    transactionToProcess
  }
}

/**
 * Get the total count of features shipped and transactions processed
 * @returns Object with total counts
 */
export function getTotalCounts(): {
  totalFeaturesShipped: number
  totalTransactionsProcessed: number
} {
  const features = loadDailyFeatures()
  
  return {
    totalFeaturesShipped: features.featuresShipped,
    totalTransactionsProcessed: features.transactionsProcessed
  }
}
