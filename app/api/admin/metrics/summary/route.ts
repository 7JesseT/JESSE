import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

interface MetricsSummary {
  totalTips: number
  totalRevenueUSDC: number
  totalRefunds: number
  totalMints: number
  shipmentsDelivered: number
  shipmentsPending: number
  timeframe: string
}

function getCacheKey(from: string, to: string): string {
  return `summary:${from}:${to}`
}

function getCachedData(key: string): any | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() })
}

function readJsonFile(filename: string): any {
  try {
    const filePath = join(process.cwd(), 'data', filename)
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.warn(`Failed to read ${filename}:`, error)
    return null
  }
}

function calculateMetricsSummary(from: string, to: string): MetricsSummary {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  
  // Read data files
  const transactionsData = readJsonFile('transactions.json')
  const refundsData = readJsonFile('refunds.json')
  const shipmentsData = readJsonFile('shipments.json')
  const mintsData = readJsonFile('mints.json')
  const tipsData = readJsonFile('tips.json')

  // Filter by date range
  const filterByDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date >= fromDate && date <= toDate
  }

  // Calculate total tips
  let totalTips = 0
  if (tipsData?.totals) {
    totalTips = Object.values(tipsData.totals).reduce((sum: number, recipient: any) => {
      return sum + (recipient.ETH || 0) + (recipient.USDC || 0)
    }, 0)
  }

  // Calculate total revenue in USDC
  let totalRevenueUSDC = 0
  if (transactionsData?.transactions) {
    const filteredTransactions = transactionsData.transactions.filter((t: any) => 
      filterByDate(t.timestamp)
    )
    
    totalRevenueUSDC = filteredTransactions.reduce((sum: number, t: any) => {
      if (t.currency === 'USDC') return sum + t.amount
      if (t.currency === 'ETH') return sum + (t.amount * 2000) // Approximate ETH to USDC
      return sum
    }, 0)
  }

  // Calculate total refunds
  let totalRefunds = 0
  if (refundsData?.refunds) {
    totalRefunds = refundsData.refunds.filter((r: any) => 
      filterByDate(r.createdAt || r.date)
    ).length
  }

  // Calculate total mints
  let totalMints = 0
  if (mintsData?.mints) {
    totalMints = mintsData.mints.filter((m: any) => 
      filterByDate(m.time || m.timestamp)
    ).length
  }

  // Calculate shipments
  let shipmentsDelivered = 0
  let shipmentsPending = 0
  if (shipmentsData && Array.isArray(shipmentsData)) {
    const filteredShipments = shipmentsData.filter((s: any) => 
      filterByDate(s.date || s.timestamp)
    )
    
    shipmentsDelivered = filteredShipments.filter((s: any) => s.status === 'delivered').length
    shipmentsPending = filteredShipments.filter((s: any) => 
      s.status === 'pending' || s.status === 'shipped'
    ).length
  }

  return {
    totalTips,
    totalRevenueUSDC,
    totalRefunds,
    totalMints,
    shipmentsDelivered,
    shipmentsPending,
    timeframe: `${from} to ${to}`
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Both from and to date parameters are required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    // Validate date format
    const fromDate = new Date(from)
    const toDate = new Date(to)
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    if (fromDate > toDate) {
      return NextResponse.json(
        { error: 'From date must be before or equal to to date' },
        { status: 400 }
      )
    }

    // Check cache
    const cacheKey = getCacheKey(from, to)
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // Calculate metrics
    const summary = calculateMetricsSummary(from, to)
    
    // Cache the result
    setCachedData(cacheKey, summary)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Metrics summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
