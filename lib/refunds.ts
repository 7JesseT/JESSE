export interface RefundRequest {
  id: string
  transactionId: string
  buyer: string // wallet address
  reason: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
  processedAt?: string
  processedBy?: string // admin wallet that processed the refund
  adminNotes?: string // admin notes for approval/denial
}

export interface RefundsData {
  refunds: RefundRequest[]
}

export type RefundStatus = RefundRequest['status']

import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const REFUNDS_PATH = path.resolve(process.cwd(), 'data/refunds.json')

const DEFAULT_REFUNDS_DATA: RefundsData = {
  refunds: []
}

export const getRefundsData = async (): Promise<RefundsData> => {
  try {
    const raw = await fs.readFile(REFUNDS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return DEFAULT_REFUNDS_DATA
  }
}

export const saveRefundsData = async (data: RefundsData): Promise<void> => {
  await fs.writeFile(REFUNDS_PATH, JSON.stringify(data, null, 2))
}

export const createRefundRequest = async (
  transactionId: string,
  buyer: string,
  reason: string
): Promise<RefundRequest> => {
  const data = await getRefundsData()
  
  // Check if refund request already exists for this transaction
  const existingRefund = data.refunds.find(r => r.transactionId === transactionId)
  if (existingRefund) {
    throw new Error('Refund request already exists for this transaction')
  }
  
  const newRefundRequest: RefundRequest = {
    id: uuidv4(),
    transactionId,
    buyer,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
  
  data.refunds.push(newRefundRequest)
  await saveRefundsData(data)
  
  return newRefundRequest
}

export const getAllRefundRequests = async (): Promise<RefundRequest[]> => {
  const data = await getRefundsData()
  return data.refunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const getRefundRequestsByBuyer = async (buyerAddress: string): Promise<RefundRequest[]> => {
  const data = await getRefundsData()
  return data.refunds.filter(r => r.buyer.toLowerCase() === buyerAddress.toLowerCase())
}

export const getRefundRequestById = async (id: string): Promise<RefundRequest | null> => {
  const data = await getRefundsData()
  return data.refunds.find(r => r.id === id) || null
}

export const updateRefundStatus = async (
  id: string,
  status: RefundStatus,
  processedBy: string,
  adminNotes?: string
): Promise<RefundRequest | null> => {
  const data = await getRefundsData()
  const refundIndex = data.refunds.findIndex(r => r.id === id)
  
  if (refundIndex === -1) {
    return null
  }
  
  data.refunds[refundIndex] = {
    ...data.refunds[refundIndex],
    status,
    processedAt: new Date().toISOString(),
    processedBy,
    adminNotes
  }
  
  await saveRefundsData(data)
  
  return data.refunds[refundIndex]
}

export const getPendingRefundRequests = async (): Promise<RefundRequest[]> => {
  const data = await getRefundsData()
  return data.refunds.filter(r => r.status === 'pending')
}
