import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

interface DailyMetrics {
  date: string
  tipsCount: number
  revenueUsd: number
  refundsCount: number
  mintsCount: number
  shipmentsDelivered: number
  shipmentsPending: number
}

function getCacheKey(days: number): string {
  return `daily:${days}`
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

function generateDailyBuckets(days: number): DailyMetrics[] {
  const buckets: DailyMetrics[] = []
  const now = new Date()
  
  // Generate date buckets for the last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    buckets.push({
      date: dateStr,
      tipsCount: 0,
      revenueUsd: 0,
      refundsCount: 0,
      mintsCount: 0,
      shipmentsDelivered: 0,
      shipmentsPending: 0
    })
  }
  
  return buckets
}

function calculateDailyMetrics(days: number): DailyMetrics[] {
  const buckets = generateDailyBuckets(days)
  const bucketMap = new Map(buckets.map(b => [b.date, b]))
  
  // Read data files
  const transactionsData = readJsonFile('transactions.json')
  const refundsData = readJsonFile('refunds.json')
  const shipmentsData = readJsonFile('shipments.json')
  const mintsData = readJsonFile('mints.json')
  const tipsData = readJsonFile('tips.json')

  // Process transactions
  if (transactionsData?.transactions) {
    transactionsData.transactions.forEach((t: any) => {
      const date = new Date(t.timestamp).toISOString().split('T')[0]
      const bucket = bucketMap.get(date)
      if (bucket) {
        if (t.type === 'tip') {
          bucket.tipsCount += 1
        }
        // Add revenue
        if (t.currency === 'USDC') {
          bucket.revenueUsd += t.amount
        } else if (t.currency === 'ETH') {
          bucket.revenueUsd += t.amount * 2000 // Approximate ETH to USDC
        }
      }
    })
  }

  // Process refunds
  if (refundsData?.refunds) {
    refundsData.refunds.forEach((r: any) => {
      const date = new Date(r.createdAt || r.date).toISOString().split('T')[0]
      const bucket = bucketMap.get(date)
      if (bucket) {
        bucket.refundsCount += 1
      }
    })
  }

  // Process mints
  if (mintsData?.mints) {
    mintsData.mints.forEach((m: any) => {
      const date = new Date(m.time || m.timestamp).toISOString().split('T')[0]
      const bucket = bucketMap.get(date)
      if (bucket) {
        bucket.mintsCount += 1
      }
    })
  }

  // Process shipments
  if (shipmentsData && Array.isArray(shipmentsData)) {
    shipmentsData.forEach((s: any) => {
      const date = new Date(s.date || s.timestamp).toISOString().split('T')[0]
      const bucket = bucketMap.get(date)
      if (bucket) {
        if (s.status === 'delivered') {
          bucket.shipmentsDelivered += 1
        } else if (s.status === 'pending' || s.status === 'shipped') {
          bucket.shipmentsPending += 1
        }
      }
    })
  }

  return buckets
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')
    
    const days = daysParam ? parseInt(daysParam, 10) : 30

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be a number between 1 and 365' },
        { status: 400 }
      )
    }

    // Check cache
    const cacheKey = getCacheKey(days)
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // Calculate daily metrics
    const dailyMetrics = calculateDailyMetrics(days)
    
    // Cache the result
    setCachedData(cacheKey, dailyMetrics)

    return NextResponse.json(dailyMetrics)
  } catch (error) {
    console.error('Daily metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
