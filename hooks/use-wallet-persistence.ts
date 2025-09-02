"use client"

import { useEffect, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { 
  saveWalletConnection, 
  loadWalletConnection, 
  clearWalletConnection, 
  isWalletConnectionValid,
  type WalletConnectionData 
} from '@/lib/wallet-persistence'

/**
 * Custom hook for wallet persistence management
 * 
 * Handles automatic wallet reconnection and persistence
 * Works with both mobile and desktop wallet flows
 */
export function useWalletPersistence() {
  const { address, isConnected, connector } = useAccount()
  const currentChainId = useChainId()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  /**
   * Save current wallet connection to localStorage
   */
  const saveConnection = useCallback(() => {
    if (isConnected && address && connector) {
      const connectionData: WalletConnectionData = {
        address,
        connectorId: connector.id,
        connectedAt: Date.now(),
        // Prefer the active chain id from Wagmi to avoid undefined connector chains
        chainId: currentChainId || 84532 // Base Sepolia fallback
      }
      saveWalletConnection(connectionData)
    }
  }, [isConnected, address, connector, currentChainId])

  /**
   * Attempt to reconnect to a previously connected wallet
   */
  const attemptReconnection = useCallback(async () => {
    if (isConnected) return // Already connected

    const savedConnection = loadWalletConnection()
    if (!savedConnection) return

    // Validate the saved connection
    if (!isWalletConnectionValid(savedConnection)) {
      clearWalletConnection()
      return
    }

    // Find the connector that was previously used
    const savedConnector = connectors.find(c => c.id === savedConnection.connectorId)
    if (!savedConnector) {
      console.log('Previously used connector not found, clearing saved connection')
      clearWalletConnection()
      return
    }

    try {
      console.log('Attempting to reconnect to wallet:', savedConnection.connectorId)
      await connect({ connector: savedConnector })
    } catch (error) {
      console.error('Failed to reconnect wallet:', error)
      // Clear the saved connection if reconnection fails
      clearWalletConnection()
    }
  }, [isConnected, connectors, connect])

  /**
   * Clear wallet connection and localStorage data
   */
  const clearConnection = useCallback(() => {
    clearWalletConnection()
    disconnect()
  }, [disconnect])

  // Save connection when wallet connects
  useEffect(() => {
    if (isConnected) {
      saveConnection()
    }
  }, [isConnected, saveConnection])

  // Attempt reconnection on mount
  useEffect(() => {
    // Small delay to ensure connectors are loaded
    const timer = setTimeout(() => {
      attemptReconnection()
    }, 100)

    return () => clearTimeout(timer)
  }, [attemptReconnection])

  // Handle wallet disconnection
  useEffect(() => {
    if (!isConnected && address === undefined) {
      // Wallet was disconnected, but don't clear localStorage immediately
      // This allows for reconnection attempts
      console.log('Wallet disconnected')
    }
  }, [isConnected, address])

  return {
    isConnected,
    address,
    connector,
    attemptReconnection,
    clearConnection,
    saveConnection
  }
}
