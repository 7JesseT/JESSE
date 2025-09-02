"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import { 
  getTodayStatus, 
  markFeatureAsShipped, 
  markTransactionAsProcessed,
  getTotalCounts,
  type DailyFeature, 
  type DailyTransaction 
} from '@/lib/daily-features'

/**
 * Custom hook for managing daily features and automatic transactions
 * 
 * Automatically ships 1 new feature and processes 1 transaction per day
 * after wallet connection
 */
export function useDailyFeatures() {
  const { isConnected, address } = useAccount()
  const { writeContract } = useWriteContract()
  
  const [todayStatus, setTodayStatus] = useState(() => getTodayStatus())
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastProcessedTx, setLastProcessedTx] = useState<string | null>(null)

  /**
   * Process a daily transaction automatically
   */
  const processDailyTransaction = useCallback(async (transaction: DailyTransaction) => {
    if (!isConnected || !address) return

    setIsProcessing(true)
    
    try {
      // For demo purposes, we'll simulate different transaction types
      // In a real app, you'd have actual contract addresses and ABIs
      const contractAddress = process.env.NEXT_PUBLIC_TIP_ADDRESS as `0x${string}`
      
      if (transaction.type === 'tip' && transaction.amount) {
        await writeContract({
          address: contractAddress,
          abi: [], // You'd need the actual ABI here
          functionName: 'transfer',
          value: parseEther(transaction.amount),
        })
      } else if (transaction.type === 'mint') {
        // Simulate mint transaction
        console.log('Processing mint transaction...')
        // You'd call your mint contract here
      } else if (transaction.type === 'paywall' && transaction.amount) {
        await writeContract({
          address: contractAddress,
          abi: [],
          functionName: 'transfer',
          value: parseEther(transaction.amount),
        })
      } else if (transaction.type === 'feature') {
        // Simulate feature deployment transaction
        console.log('Processing feature deployment transaction...')
      }

      // Mark transaction as processed
      markTransactionAsProcessed(transaction, '0x' + Math.random().toString(16).substr(2, 64))
      setLastProcessedTx(transaction.id)
      
      // Update today's status
      setTodayStatus(getTodayStatus())
      
    } catch (error) {
      console.error('Failed to process daily transaction:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [isConnected, address, writeContract])

  /**
   * Ship today's feature
   */
  const shipTodaysFeature = useCallback((feature: DailyFeature) => {
    markFeatureAsShipped(feature)
    setTodayStatus(getTodayStatus())
    console.log('Feature shipped:', feature.title)
  }, [])

  /**
   * Handle automatic daily operations when wallet connects
   */
  const handleDailyOperations = useCallback(async () => {
    if (!isConnected) return

    const status = getTodayStatus()
    
    // Ship feature if needed
    if (status.featureToShip) {
      shipTodaysFeature(status.featureToShip)
    }
    
    // Process transaction if needed
    if (status.transactionToProcess) {
      await processDailyTransaction(status.transactionToProcess)
    }
  }, [isConnected, shipTodaysFeature, processDailyTransaction])

  // Trigger daily operations when wallet connects
  useEffect(() => {
    if (isConnected) {
      // Small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        handleDailyOperations()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isConnected, handleDailyOperations])

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTodayStatus(getTodayStatus())
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const totalCounts = getTotalCounts()

  return {
    todayStatus,
    isProcessing,
    lastProcessedTx,
    totalCounts,
    shipTodaysFeature,
    processDailyTransaction,
    handleDailyOperations
  }
}
