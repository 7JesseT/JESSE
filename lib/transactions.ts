export interface Transaction {
  id: string
  user: string // wallet address
  amount: number
  currency: 'ETH' | 'USDC'
  type: 'tip' | 'nft_mint' | 'file_purchase' | 'special_reward'
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered'
  timestamp: string
  txHash?: string // blockchain transaction hash
  metadata?: {
    recipientId?: string // for tips
    fileId?: string // for file purchases
    event?: string // for NFT mints
    tokenId?: string // for NFT mints
  }
}

export interface TransactionsData {
  transactions: Transaction[]
}

export type TransactionStatus = Transaction['status']
export type TransactionType = Transaction['type']
export type SupportedCurrency = Transaction['currency']

import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const TRANSACTIONS_PATH = path.resolve(process.cwd(), 'data/transactions.json')

const DEFAULT_TRANSACTIONS_DATA: TransactionsData = {
  transactions: []
}

export const getTransactionsData = async (): Promise<TransactionsData> => {
  try {
    const raw = await fs.readFile(TRANSACTIONS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return DEFAULT_TRANSACTIONS_DATA
  }
}

export const saveTransactionsData = async (data: TransactionsData): Promise<void> => {
  await fs.writeFile(TRANSACTIONS_PATH, JSON.stringify(data, null, 2))
}

export const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const data = await getTransactionsData()
  const newTransaction: Transaction = {
    ...transaction,
    id: uuidv4()
  }
  
  data.transactions.push(newTransaction)
  await saveTransactionsData(data)
  
  return newTransaction
}

export const getTransactionsByUser = async (userAddress: string): Promise<Transaction[]> => {
  const data = await getTransactionsData()
  return data.transactions.filter(t => t.user.toLowerCase() === userAddress.toLowerCase())
}

export const updateTransactionStatus = async (id: string, status: TransactionStatus): Promise<Transaction | null> => {
  const data = await getTransactionsData()
  const transactionIndex = data.transactions.findIndex(t => t.id === id)
  
  if (transactionIndex === -1) {
    return null
  }
  
  data.transactions[transactionIndex].status = status
  await saveTransactionsData(data)
  
  return data.transactions[transactionIndex]
}

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const data = await getTransactionsData()
  return data.transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  const data = await getTransactionsData()
  return data.transactions.find(t => t.id === id) || null
}
