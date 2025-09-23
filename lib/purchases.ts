import { promises as fs } from 'fs';
import path from 'path';

export interface Purchase {
  token: string;
  fileId: string;
  txHash: string;
  buyer: string;
  timestamp: string;
  expiry: string;
}

export interface PurchasesData {
  purchases: Purchase[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');

export async function readPurchasesData(): Promise<PurchasesData> {
  try {
    const data = await fs.readFile(PURCHASES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty structure
    return { purchases: [] };
  }
}

export async function writePurchasesData(data: PurchasesData): Promise<void> {
  await fs.writeFile(PURCHASES_FILE, JSON.stringify(data, null, 2));
}

export async function addPurchase(purchase: Purchase): Promise<void> {
  const data = await readPurchasesData();
  data.purchases.push(purchase);
  await writePurchasesData(data);
}

export async function getPurchaseByToken(token: string): Promise<Purchase | null> {
  const data = await readPurchasesData();
  return data.purchases.find(purchase => purchase.token === token) || null;
}

export async function getPurchasesByBuyer(buyer: string): Promise<Purchase[]> {
  const data = await readPurchasesData();
  return data.purchases.filter(purchase => purchase.buyer.toLowerCase() === buyer.toLowerCase());
}

export async function getAllPurchases(): Promise<Purchase[]> {
  const data = await readPurchasesData();
  return data.purchases;
}

export async function isTokenValid(token: string): Promise<boolean> {
  const purchase = await getPurchaseByToken(token);
  if (!purchase) return false;
  
  const now = new Date();
  const expiry = new Date(purchase.expiry);
  return now < expiry;
}
