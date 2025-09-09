// Client-side utilities for invite management
// These functions make API calls instead of direct file operations

import { RECIPIENTS } from '@/config/recipients'
import { type SupportedCurrency } from '@/config/addresses'

export type Invite = {
  id: string
  token: string
  recipientId: string
  currency: SupportedCurrency
  amount: string
  createdAt: string
  expiryAt: string | null
  used: boolean
  usedBy: string | null
  usedAt: string | null
  txHash: string | null
}

export function getInviteStatus(invite: Invite): 'unused' | 'used' | 'expired' {
  if (invite.used) {
    return 'used'
  }
  
  if (invite.expiryAt && new Date(invite.expiryAt) < new Date()) {
    return 'expired'
  }
  
  return 'unused'
}

export function getRecipientName(recipientId: string): string {
  const recipient = RECIPIENTS.find(r => r.id === recipientId)
  return recipient?.name || recipientId
}

export function validateInviteData(recipientId: string, currency: SupportedCurrency, amount: string, expiryMinutes?: number): { valid: boolean; error?: string } {
  // Validate recipient
  const recipient = RECIPIENTS.find(r => r.id === recipientId)
  if (!recipient) {
    return { valid: false, error: 'Invalid recipient' }
  }
  
  // Validate currency
  if (!['ETH', 'USDC'].includes(currency)) {
    return { valid: false, error: 'Invalid currency' }
  }
  
  // Validate amount
  const numericAmount = Number(amount)
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return { valid: false, error: 'Invalid amount' }
  }
  
  // Validate expiry (if provided)
  if (expiryMinutes !== undefined && (expiryMinutes < 1 || expiryMinutes > 525600)) { // Max 1 year
    return { valid: false, error: 'Expiry must be between 1 minute and 1 year' }
  }
  
  return { valid: true }
}
