import { promises as fs } from 'fs';
import path from 'path';

export interface FileMetadata {
  id: string;
  filename: string;
  title: string;
  description: string;
  priceUsd: number;
  priceToken: string;
  recipient: string;
  uploadedAt: string;
}

export interface FilesData {
  files: FileMetadata[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILES_FILE = path.join(DATA_DIR, 'files.json');

export async function readFilesData(): Promise<FilesData> {
  try {
    const data = await fs.readFile(FILES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty structure
    return { files: [] };
  }
}

export async function writeFilesData(data: FilesData): Promise<void> {
  await fs.writeFile(FILES_FILE, JSON.stringify(data, null, 2));
}

export async function addFile(file: FileMetadata): Promise<void> {
  const data = await readFilesData();
  data.files.push(file);
  await writeFilesData(data);
}

export async function getFileById(id: string): Promise<FileMetadata | null> {
  const data = await readFilesData();
  return data.files.find(file => file.id === id) || null;
}

export async function getAllFiles(): Promise<FileMetadata[]> {
  const data = await readFilesData();
  return data.files;
}
