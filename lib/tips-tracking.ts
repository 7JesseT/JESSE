import { RECIPIENTS, type Recipient } from "@/config/recipients"
import { type SupportedCurrency } from "@/config/addresses"

export type TipTransaction = {
  txHash: string
  amount: number
  currency: SupportedCurrency
  recipientId: string
  recipientName: string
  timestamp: string
}

export type TipsData = {
  totals: Record<string, Record<SupportedCurrency, number>>
  transactions: TipTransaction[]
}

const TIPS_STORAGE_KEY = "baseDaily:tips"
const DEFAULT_TIPS_DATA: TipsData = {
  totals: RECIPIENTS.reduce((acc, recipient) => {
    acc[recipient.id] = { ETH: 0, USDC: 0 }
    return acc
  }, {} as Record<string, Record<SupportedCurrency, number>>),
  transactions: []
}

export const getTipsData = (): TipsData => {
  if (typeof window === "undefined") return DEFAULT_TIPS_DATA
  
  try {
    const stored = localStorage.getItem(TIPS_STORAGE_KEY)
    if (!stored) return DEFAULT_TIPS_DATA
    
    const parsed = JSON.parse(stored) as TipsData
    // Ensure all recipients have totals initialized
    const totals = RECIPIENTS.reduce((acc, recipient) => {
      acc[recipient.id] = parsed.totals[recipient.id] || { ETH: 0, USDC: 0 }
      return acc
    }, {} as Record<string, Record<SupportedCurrency, number>>)
    
    return {
      totals,
      transactions: parsed.transactions || []
    }
  } catch {
    return DEFAULT_TIPS_DATA
  }
}

export const saveTipTransaction = (transaction: TipTransaction): void => {
  if (typeof window === "undefined") return
  
  try {
    const currentData = getTipsData()
    const newData: TipsData = {
      totals: {
        ...currentData.totals,
        [transaction.recipientId]: {
          ...currentData.totals[transaction.recipientId],
          [transaction.currency]: (currentData.totals[transaction.recipientId]?.[transaction.currency] || 0) + transaction.amount
        }
      },
      transactions: [transaction, ...currentData.transactions]
    }
    
    localStorage.setItem(TIPS_STORAGE_KEY, JSON.stringify(newData))
  } catch (error) {
    console.error("Failed to save tip transaction:", error)
  }
}

export const getRecipientTotals = (recipientId: string): Record<SupportedCurrency, number> => {
  const data = getTipsData()
  return data.totals[recipientId] || { ETH: 0, USDC: 0 }
}

export const getAllTotals = (): Record<string, Record<SupportedCurrency, number>> => {
  return getTipsData().totals
}

export const getRecentTransactions = (limit: number = 10): TipTransaction[] => {
  const data = getTipsData()
  return data.transactions.slice(0, limit)
}
