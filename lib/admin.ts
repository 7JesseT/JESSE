import { readMintsData, Mint } from './mints';
import { readPurchasesData, Purchase } from './purchases';

export interface Transaction {
  wallet: string;
  txHash: string;
  type: 'mint' | 'purchase' | 'tip';
  token: string;
  amount: number;
  timestamp: string;
}

export interface EventStats {
  event: string;
  totalMints: number;
  totalPurchases: number;
  uniqueWallets: number;
  transactions: Transaction[];
}

export type Period = '24h' | '7d' | '30d' | 'all';

export function getPeriodFilter(period: Period): Date | null {
  const now = new Date();
  switch (period) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
    default:
      return null;
  }
}

export async function getEventStats(eventId: string, period: Period = 'all'): Promise<EventStats> {
  try {
    const [mintsData, purchasesData] = await Promise.all([
      readMintsData(),
      readPurchasesData()
    ]);

    const periodFilter = getPeriodFilter(period);
    
    // Filter mints by event and period
    const eventMints = mintsData.mints.filter(mint => {
      if (mint.event !== eventId) return false;
      if (!periodFilter) return true;
      const mintTime = new Date(mint.time);
      return mintTime >= periodFilter;
    });

    // Filter purchases by period (we'll assume purchases are related to events via fileId)
    const eventPurchases = purchasesData.purchases.filter(purchase => {
      if (!periodFilter) return true;
      const purchaseTime = new Date(purchase.timestamp);
      return purchaseTime >= periodFilter;
    });

    // Convert to transactions format
    const transactions: Transaction[] = [
      ...eventMints.map(mint => ({
        wallet: mint.wallet,
        txHash: mint.txHash,
        type: 'mint' as const,
        token: 'ETH', // Default token for mints
        amount: 1, // Default amount for mints
        timestamp: mint.time
      })),
      ...eventPurchases.map(purchase => ({
        wallet: purchase.buyer,
        txHash: purchase.txHash,
        type: 'purchase' as const,
        token: purchase.token,
        amount: 1, // Default amount for purchases
        timestamp: purchase.timestamp
      }))
    ];

    // Get unique wallets
    const uniqueWallets = new Set([
      ...eventMints.map(mint => mint.wallet.toLowerCase()),
      ...eventPurchases.map(purchase => purchase.buyer.toLowerCase())
    ]);

    return {
      event: eventId,
      totalMints: eventMints.length,
      totalPurchases: eventPurchases.length,
      uniqueWallets: uniqueWallets.size,
      transactions: transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    };
  } catch (error) {
    console.error('Error getting event stats:', error);
    return {
      event: eventId,
      totalMints: 0,
      totalPurchases: 0,
      uniqueWallets: 0,
      transactions: []
    };
  }
}

export function toCsv(transactions: Transaction[]): string {
  const headers = ['Wallet', 'Transaction Hash', 'Type', 'Token', 'Amount', 'Timestamp'];
  const rows = transactions.map(tx => [
    tx.wallet,
    tx.txHash,
    tx.type,
    tx.token,
    tx.amount.toString(),
    tx.timestamp
  ]);

  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
}

export async function getAllEvents(): Promise<string[]> {
  try {
    const [mintsData, purchasesData] = await Promise.all([
      readMintsData(),
      readPurchasesData()
    ]);

    const events = new Set<string>();
    
    // Get events from mints
    mintsData.mints.forEach(mint => {
      if (mint.event) events.add(mint.event);
    });

    // For purchases, we'll use a default event name since they don't have event field
    if (purchasesData.purchases.length > 0) {
      events.add('purchases');
    }

    return Array.from(events).sort();
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
}

