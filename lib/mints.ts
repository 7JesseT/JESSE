import { promises as fs } from 'fs';
import path from 'path';

export interface Mint {
  wallet: string;
  event: string;
  time: string;
  txHash: string;
}

export interface MintsData {
  mints: Mint[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const MINTS_FILE = path.join(DATA_DIR, 'mints.json');

export async function readMintsData(): Promise<MintsData> {
  try {
    const data = await fs.readFile(MINTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    // Handle both array format and object format
    if (Array.isArray(parsed)) {
      return { mints: parsed };
    }
    return parsed;
  } catch (error) {
    // If file doesn't exist, return empty structure
    return { mints: [] };
  }
}

export async function writeMintsData(data: MintsData): Promise<void> {
  await fs.writeFile(MINTS_FILE, JSON.stringify(data, null, 2));
}

export async function addMint(mint: Mint): Promise<void> {
  const data = await readMintsData();
  data.mints.push(mint);
  await writeMintsData(data);
}

export async function getMintsByEvent(event: string): Promise<Mint[]> {
  const data = await readMintsData();
  return data.mints.filter(mint => mint.event === event);
}

export async function getMintsByWallet(wallet: string): Promise<Mint[]> {
  const data = await readMintsData();
  return data.mints.filter(mint => mint.wallet.toLowerCase() === wallet.toLowerCase());
}

export async function getAllMints(): Promise<Mint[]> {
  const data = await readMintsData();
  return data.mints;
}

