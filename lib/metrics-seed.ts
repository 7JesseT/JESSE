import { writeFileSync, readFileSync, existsSync, renameSync } from 'fs'
import { join } from 'path'

interface SeedResult {
  success: boolean
  error?: string
  dataGenerated?: {
    transactions: number
    refunds: number
    shipments: number
    mints: number
    tips: number
  }
}

interface Transaction {
  id: string
  user: string
  amount: number
  currency: 'USDC' | 'ETH'
  type: 'tip' | 'file_purchase' | 'nft_purchase' | 'nft_mint'
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'refunded'
  timestamp: string
  txHash: string
  metadata?: any
}

interface Refund {
  id: string
  transactionId: string
  buyer: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  processedAt?: string
  processedBy?: string
  adminNotes?: string
}

interface Shipment {
  id: string
  transactionId: string
  buyer: string
  status: 'pending' | 'shipped' | 'delivered'
  trackingNumber?: string
  date: string
  estimatedDelivery?: string
  actualDelivery?: string
}

interface Mint {
  wallet: string
  tokenId: number
  date: string
  txHash: string
  event?: string
}

interface TipsData {
  totals: Record<string, { ETH: number; USDC: number }>
  transactions: Array<{
    id: string
    from: string
    to: string
    amount: number
    currency: 'ETH' | 'USDC'
    timestamp: string
    txHash: string
  }>
}

// Deterministic random number generator
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min
  }
}

function generateWalletAddress(rng: SeededRandom): string {
  const chars = '0123456789abcdef'
  let address = '0x'
  for (let i = 0; i < 40; i++) {
    address += chars[rng.nextInt(0, 15)]
  }
  return address
}

function generateTxHash(rng: SeededRandom): string {
  const chars = '0123456789abcdef'
  let hash = '0x'
  for (let i = 0; i < 64; i++) {
    hash += chars[rng.nextInt(0, 15)]
  }
  return hash
}

function generateDate(daysAgo: number, rng: SeededRandom): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(rng.nextInt(0, 23), rng.nextInt(0, 59), rng.nextInt(0, 59))
  return date.toISOString()
}

function backupExistingFile(filePath: string): void {
  if (existsSync(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`
    renameSync(filePath, backupPath)
    console.log(`Backed up existing file to: ${backupPath}`)
  }
}

function generateTransactions(days: number, rng: SeededRandom): Transaction[] {
  const transactions: Transaction[] = []
  const transactionTypes: Array<Transaction['type']> = ['tip', 'file_purchase', 'nft_purchase', 'nft_mint']
  const statuses: Array<Transaction['status']> = ['pending', 'confirmed', 'shipped', 'delivered', 'refunded']
  const currencies: Array<Transaction['currency']> = ['USDC', 'ETH']

  for (let day = 0; day < days; day++) {
    const transactionsPerDay = rng.nextInt(0, 8) // 0-8 transactions per day
    
    for (let i = 0; i < transactionsPerDay; i++) {
      const type = transactionTypes[rng.nextInt(0, transactionTypes.length - 1)]
      const currency = currencies[rng.nextInt(0, currencies.length - 1)]
      const status = statuses[rng.nextInt(0, statuses.length - 1)]
      
      let amount: number
      if (currency === 'USDC') {
        amount = rng.nextFloat(1, 50)
      } else {
        amount = rng.nextFloat(0.001, 0.1)
      }

      const transaction: Transaction = {
        id: `seed-${day}-${i}`,
        user: generateWalletAddress(rng),
        amount: Math.round(amount * 100) / 100,
        currency,
        type,
        status,
        timestamp: generateDate(day, rng),
        txHash: generateTxHash(rng),
        metadata: {
          ...(type === 'file_purchase' && { fileId: `file-${rng.nextInt(1, 10)}` }),
          ...(type === 'nft_purchase' && { 
            tokenId: rng.nextInt(1, 1000),
            contractAddress: generateWalletAddress(rng),
            tokenAmount: 1
          }),
          ...(type === 'nft_mint' && { 
            event: `week${rng.nextInt(1, 12)}`,
            tokenId: rng.nextInt(1, 1000)
          }),
          ...(type === 'tip' && { recipientId: `recipient-${rng.nextInt(1, 5)}` })
        }
      }

      transactions.push(transaction)
    }
  }

  return transactions
}

function generateRefunds(transactions: Transaction[], rng: SeededRandom): Refund[] {
  const refunds: Refund[] = []
  const refundReasons = [
    'Changed my mind about the purchase',
    'Product not as described',
    'Accidental purchase',
    'Technical issues with the product',
    'Duplicate purchase',
    'Found a better alternative'
  ]

  // Generate refunds for some transactions
  const refundableTransactions = transactions.filter(t => 
    t.type !== 'nft_mint' && t.status !== 'refunded'
  )

  const numRefunds = Math.min(rng.nextInt(0, Math.floor(transactions.length * 0.3)), refundableTransactions.length)

  for (let i = 0; i < numRefunds; i++) {
    const transaction = refundableTransactions[rng.nextInt(0, refundableTransactions.length - 1)]
    const status = rng.nextInt(0, 2) === 0 ? 'pending' : 'approved'
    
    const refund: Refund = {
      id: `refund-${i}`,
      transactionId: transaction.id,
      buyer: transaction.user,
      reason: refundReasons[rng.nextInt(0, refundReasons.length - 1)],
      status,
      createdAt: generateDate(rng.nextInt(0, 30), rng),
      ...(status === 'approved' && {
        processedAt: generateDate(rng.nextInt(0, 5), rng),
        processedBy: generateWalletAddress(rng),
        adminNotes: 'Approved refund. Product will be deactivated and funds returned.'
      })
    }

    refunds.push(refund)
  }

  return refunds
}

function generateShipments(transactions: Transaction[], rng: SeededRandom): Shipment[] {
  const shipments: Shipment[] = []
  const statuses: Array<Shipment['status']> = ['pending', 'shipped', 'delivered']

  // Generate shipments for file purchases and NFT purchases
  const shippableTransactions = transactions.filter(t => 
    t.type === 'file_purchase' || t.type === 'nft_purchase'
  )

  for (const transaction of shippableTransactions) {
    const status = statuses[rng.nextInt(0, statuses.length - 1)]
    
    const shipment: Shipment = {
      id: `shipment-${transaction.id}`,
      transactionId: transaction.id,
      buyer: transaction.user,
      status,
      date: transaction.timestamp,
      ...(status === 'shipped' && {
        trackingNumber: `TRK${rng.nextInt(100000, 999999)}`,
        estimatedDelivery: generateDate(rng.nextInt(1, 7), rng)
      }),
      ...(status === 'delivered' && {
        trackingNumber: `TRK${rng.nextInt(100000, 999999)}`,
        estimatedDelivery: generateDate(rng.nextInt(1, 7), rng),
        actualDelivery: generateDate(rng.nextInt(0, 3), rng)
      })
    }

    shipments.push(shipment)
  }

  return shipments
}

function generateMints(days: number, rng: SeededRandom): Mint[] {
  const mints: Mint[] = []

  for (let day = 0; day < days; day++) {
    const mintsPerDay = rng.nextInt(0, 5) // 0-5 mints per day
    
    for (let i = 0; i < mintsPerDay; i++) {
      const mint: Mint = {
        wallet: generateWalletAddress(rng),
        tokenId: rng.nextInt(1, 1000),
        date: generateDate(day, rng),
        txHash: generateTxHash(rng),
        event: `week${rng.nextInt(1, 12)}`
      }

      mints.push(mint)
    }
  }

  return mints
}

function generateTips(days: number, rng: SeededRandom): TipsData {
  const recipients = ['env-club', 'dev-fund', 'community', 'charity', 'maintainer']
  const totals: Record<string, { ETH: number; USDC: number }> = {}
  const transactions: TipsData['transactions'] = []

  // Initialize totals
  recipients.forEach(recipient => {
    totals[recipient] = { ETH: 0, USDC: 0 }
  })

  for (let day = 0; day < days; day++) {
    const tipsPerDay = rng.nextInt(0, 3) // 0-3 tips per day
    
    for (let i = 0; i < tipsPerDay; i++) {
      const recipient = recipients[rng.nextInt(0, recipients.length - 1)]
      const currency = rng.nextInt(0, 1) === 0 ? 'ETH' : 'USDC'
      const amount = currency === 'USDC' 
        ? rng.nextFloat(1, 20) 
        : rng.nextFloat(0.001, 0.05)

      totals[recipient][currency] += amount

      transactions.push({
        id: `tip-${day}-${i}`,
        from: generateWalletAddress(rng),
        to: recipient,
        amount: Math.round(amount * 1000) / 1000,
        currency,
        timestamp: generateDate(day, rng),
        txHash: generateTxHash(rng)
      })
    }
  }

  return { totals, transactions }
}

export async function generateSeedData(): Promise<SeedResult> {
  try {
    const seed = 12345 // Deterministic seed for repeatability
    const rng = new SeededRandom(seed)
    const days = 30

    console.log('Generating seed data...')

    // Generate data
    const transactions = generateTransactions(days, rng)
    const refunds = generateRefunds(transactions, rng)
    const shipments = generateShipments(transactions, rng)
    const mints = generateMints(days, rng)
    const tips = generateTips(days, rng)

    // Backup existing files
    const dataDir = join(process.cwd(), 'data')
    const filesToBackup = [
      'transactions.json',
      'refunds.json', 
      'shipments.json',
      'mints.json',
      'tips.json'
    ]

    filesToBackup.forEach(filename => {
      const filePath = join(dataDir, filename)
      backupExistingFile(filePath)
    })

    // Write new data files
    writeFileSync(join(dataDir, 'transactions.json'), JSON.stringify({ transactions }, null, 2))
    writeFileSync(join(dataDir, 'refunds.json'), JSON.stringify({ refunds }, null, 2))
    writeFileSync(join(dataDir, 'shipments.json'), JSON.stringify(shipments, null, 2))
    writeFileSync(join(dataDir, 'mints.json'), JSON.stringify({ mints }, null, 2))
    writeFileSync(join(dataDir, 'tips.json'), JSON.stringify(tips, null, 2))

    console.log('Seed data generated successfully')

    return {
      success: true,
      dataGenerated: {
        transactions: transactions.length,
        refunds: refunds.length,
        shipments: shipments.length,
        mints: mints.length,
        tips: tips.transactions.length
      }
    }
  } catch (error) {
    console.error('Error generating seed data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
