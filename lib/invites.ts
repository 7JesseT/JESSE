import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { RECIPIENTS } from '@/config/recipients'
import { type SupportedCurrency } from '@/config/addresses'

// Server-only utilities - these should only be used in API routes

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

export type InvitesData = {
  invites: Invite[]
}

const INVITES_FILE_PATH = join(process.cwd(), 'data', 'invites.json')
const DEFAULT_INVITES_DATA: InvitesData = {
  invites: []
}

export function readInvites(): InvitesData {
  try {
    if (!existsSync(INVITES_FILE_PATH)) {
      return DEFAULT_INVITES_DATA
    }
    
    const fileContent = readFileSync(INVITES_FILE_PATH, 'utf-8')
    const parsed = JSON.parse(fileContent) as InvitesData
    
    // Ensure invites array exists
    return {
      invites: parsed.invites || []
    }
  } catch (error) {
    console.error('Error reading invites:', error)
    return DEFAULT_INVITES_DATA
  }
}

export function writeInvites(data: InvitesData): void {
  try {
    writeFileSync(INVITES_FILE_PATH, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing invites:', error)
    throw new Error('Failed to save invites')
  }
}

export function addInvite(inviteData: Omit<Invite, 'id' | 'token' | 'createdAt' | 'used' | 'usedBy' | 'usedAt' | 'txHash'>): { token: string; url: string } {
  const data = readInvites()
  
  // Generate unique token
  const token = uuidv4().replace(/-/g, '').substring(0, 8)
  
  // Check if token already exists (very unlikely but safe)
  const existingInvite = data.invites.find(invite => invite.token === token)
  if (existingInvite) {
    // Regenerate token if collision
    return addInvite(inviteData)
  }
  
  const newInvite: Invite = {
    id: uuidv4(),
    token,
    createdAt: new Date().toISOString(),
    used: false,
    usedBy: null,
    usedAt: null,
    txHash: null,
    ...inviteData
  }
  
  data.invites.push(newInvite)
  writeInvites(data)
  
  return {
    token,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${token}`
  }
}

export function findInviteByToken(token: string): Invite | null {
  const data = readInvites()
  return data.invites.find(invite => invite.token === token) || null
}

export function markInviteUsed(token: string, txHash: string, walletAddress: string): boolean {
  const data = readInvites()
  const invite = data.invites.find(invite => invite.token === token)
  
  if (!invite) {
    return false
  }
  
  // Check if already used
  if (invite.used) {
    return false
  }
  
  // Check if expired
  if (invite.expiryAt && new Date(invite.expiryAt) < new Date()) {
    return false
  }
  
  // Mark as used
  invite.used = true
  invite.usedBy = walletAddress
  invite.usedAt = new Date().toISOString()
  invite.txHash = txHash
  
  writeInvites(data)
  return true
}

export function revokeInvite(token: string): boolean {
  const data = readInvites()
  const invite = data.invites.find(invite => invite.token === token)
  
  if (!invite) {
    return false
  }
  
  // Mark as used (effectively revoking it)
  invite.used = true
  invite.usedBy = 'admin-revoked'
  invite.usedAt = new Date().toISOString()
  invite.txHash = null
  
  writeInvites(data)
  return true
}

export function getAllInvites(): Invite[] {
  const data = readInvites()
  return data.invites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

export function calculateExpiryAt(expiryMinutes?: number): string | null {
  if (!expiryMinutes) return null
  
  const expiryDate = new Date()
  expiryDate.setMinutes(expiryDate.getMinutes() + expiryMinutes)
  return expiryDate.toISOString()
}

export function exportInvitesToCsv(): string {
  const invites = getAllInvites()
  const headers = ['Token', 'Recipient', 'Currency', 'Amount', 'Created At', 'Expiry At', 'Status', 'Used By', 'Used At', 'Transaction Hash']
  
  const rows = invites.map(invite => {
    const recipient = RECIPIENTS.find(r => r.id === invite.recipientId)
    const status = getInviteStatus(invite)
    
    return [
      invite.token,
      recipient?.name || invite.recipientId,
      invite.currency,
      invite.amount,
      invite.createdAt,
      invite.expiryAt || '',
      status,
      invite.usedBy || '',
      invite.usedAt || '',
      invite.txHash || ''
    ]
  })
  
  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
}
