/**
 * Wallet Persistence Utilities
 * 
 * Handles localStorage operations for wallet connection persistence
 * Supports both mobile and desktop wallet flows
 */

export interface WalletConnectionData {
  address: string
  connectorId: string
  connectedAt: number
  chainId: number
}

export interface DailyFeatureData {
  lastFeatureDate: string
  lastTransactionDate: string
  featuresShipped: number
  transactionsProcessed: number
}

// Storage keys for localStorage
const WALLET_CONNECTION_KEY = 'base-daily-wallet-connection'
const DAILY_FEATURES_KEY = 'base-daily-features'

/**
 * Save wallet connection data to localStorage
 * @param connectionData - The wallet connection information to persist
 */
export function saveWalletConnection(connectionData: WalletConnectionData): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(WALLET_CONNECTION_KEY, JSON.stringify(connectionData))
    console.log('Wallet connection saved:', connectionData)
  } catch (error) {
    console.error('Failed to save wallet connection:', error)
  }
}

/**
 * Load wallet connection data from localStorage
 * @returns The saved wallet connection data or null if not found
 */
export function loadWalletConnection(): WalletConnectionData | null {
  if (typeof window === 'undefined') return null
  
  try {
    const saved = localStorage.getItem(WALLET_CONNECTION_KEY)
    if (!saved) return null
    
    const connectionData = JSON.parse(saved) as WalletConnectionData
    
    // Validate the connection data structure
    if (!connectionData.address || !connectionData.connectorId) {
      console.warn('Invalid wallet connection data found, clearing...')
      clearWalletConnection()
      return null
    }
    
    return connectionData
  } catch (error) {
    console.error('Failed to load wallet connection:', error)
    clearWalletConnection()
    return null
  }
}

/**
 * Clear wallet connection data from localStorage
 */
export function clearWalletConnection(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(WALLET_CONNECTION_KEY)
    console.log('Wallet connection cleared')
  } catch (error) {
    console.error('Failed to clear wallet connection:', error)
  }
}

/**
 * Check if wallet connection is still valid
 * @param connectionData - The connection data to validate
 * @returns true if connection is still valid, false otherwise
 */
export function isWalletConnectionValid(connectionData: WalletConnectionData): boolean {
  // Check if connection is not too old (7 days max)
  const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  const now = Date.now()
  
  if (now - connectionData.connectedAt > maxAge) {
    console.log('Wallet connection expired (older than 7 days)')
    return false
  }
  
  return true
}

/**
 * Save daily features data to localStorage
 * @param featureData - The daily features data to persist
 */
export function saveDailyFeatures(featureData: DailyFeatureData): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(DAILY_FEATURES_KEY, JSON.stringify(featureData))
    console.log('Daily features saved:', featureData)
  } catch (error) {
    console.error('Failed to save daily features:', error)
  }
}

/**
 * Load daily features data from localStorage
 * @returns The saved daily features data or default values
 */
export function loadDailyFeatures(): DailyFeatureData {
  if (typeof window === 'undefined') {
    return {
      lastFeatureDate: '',
      lastTransactionDate: '',
      featuresShipped: 0,
      transactionsProcessed: 0
    }
  }
  
  try {
    const saved = localStorage.getItem(DAILY_FEATURES_KEY)
    if (!saved) {
      return {
        lastFeatureDate: '',
        lastTransactionDate: '',
        featuresShipped: 0,
        transactionsProcessed: 0
      }
    }
    
    return JSON.parse(saved) as DailyFeatureData
  } catch (error) {
    console.error('Failed to load daily features:', error)
    return {
      lastFeatureDate: '',
      lastTransactionDate: '',
      featuresShipped: 0,
      transactionsProcessed: 0
    }
  }
}

/**
 * Check if a new feature should be shipped today
 * @returns true if a new feature should be shipped, false otherwise
 */
export function shouldShipFeatureToday(): boolean {
  const today = new Date().toDateString()
  const features = loadDailyFeatures()
  
  return features.lastFeatureDate !== today
}

/**
 * Check if a transaction should be processed today
 * @returns true if a transaction should be processed, false otherwise
 */
export function shouldProcessTransactionToday(): boolean {
  const today = new Date().toDateString()
  const features = loadDailyFeatures()
  
  return features.lastTransactionDate !== today
}

/**
 * Mark that a feature was shipped today
 */
export function markFeatureShippedToday(): void {
  const today = new Date().toDateString()
  const features = loadDailyFeatures()
  
  const updatedFeatures: DailyFeatureData = {
    ...features,
    lastFeatureDate: today,
    featuresShipped: features.featuresShipped + 1
  }
  
  saveDailyFeatures(updatedFeatures)
}

/**
 * Mark that a transaction was processed today
 */
export function markTransactionProcessedToday(): void {
  const today = new Date().toDateString()
  const features = loadDailyFeatures()
  
  const updatedFeatures: DailyFeatureData = {
    ...features,
    lastTransactionDate: today,
    transactionsProcessed: features.transactionsProcessed + 1
  }
  
  saveDailyFeatures(updatedFeatures)
}

/**
 * Get today's date as a string for consistent comparison
 * @returns Today's date as YYYY-MM-DD string
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}
