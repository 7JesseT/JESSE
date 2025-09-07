import { promises as fs } from 'fs';
import path from 'path';

export interface Receipt {
  id: string;
  txHash: string;
  assetId: string;
  buyer: string;
  amount: string;
  currency: 'USDC' | 'ETH';
  timestamp: string;
  assetTitle?: string;
  assetDescription?: string;
  assetPrice?: string;
}

export interface ReceiptsData {
  receipts: Receipt[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const RECEIPTS_FILE = path.join(DATA_DIR, 'receipts.json');

export async function readReceiptsData(): Promise<ReceiptsData> {
  try {
    const data = await fs.readFile(RECEIPTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty structure
    return { receipts: [] };
  }
}

export async function writeReceiptsData(data: ReceiptsData): Promise<void> {
  await fs.writeFile(RECEIPTS_FILE, JSON.stringify(data, null, 2));
}

export async function addReceipt(receipt: Receipt): Promise<void> {
  const data = await readReceiptsData();
  // Add newest receipt at the beginning
  data.receipts.unshift(receipt);
  await writeReceiptsData(data);
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  const data = await readReceiptsData();
  return data.receipts.find(receipt => receipt.id === id) || null;
}

export async function getReceiptsByBuyer(buyer: string): Promise<Receipt[]> {
  const data = await readReceiptsData();
  return data.receipts.filter(receipt => receipt.buyer.toLowerCase() === buyer.toLowerCase());
}

export async function getAllReceipts(): Promise<Receipt[]> {
  const data = await readReceiptsData();
  return data.receipts;
}

export async function hasUserPurchasedAsset(buyer: string, assetId: string): Promise<boolean> {
  const data = await readReceiptsData();
  return data.receipts.some(
    receipt => 
      receipt.buyer.toLowerCase() === buyer.toLowerCase() && 
      receipt.assetId === assetId
  );
}
