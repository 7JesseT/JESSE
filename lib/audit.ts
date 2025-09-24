import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface AuditEvent {
  id: string;
  type: 'payment' | 'mint' | 'special-mint' | 'refund' | 'upload' | 'invite' | 'admin' | 'login' | 'invite_use' | 'refund_request' | 'refund_processed' | string;
  actor?: string;
  user?: string;
  details?: Record<string, any>;
  ip?: string | null;
  metadata?: string;
  timestamp: string;
}

const AUDIT_FILE_PATH = path.resolve(process.cwd(), 'data', 'audit-logs.json');

/**
 * Ensures the data directory and audit file exist
 */
async function ensureAuditFile(): Promise<void> {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(AUDIT_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Check if audit file exists, create empty array if not
    try {
      await fs.access(AUDIT_FILE_PATH);
    } catch {
      await fs.writeFile(AUDIT_FILE_PATH, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error ensuring audit file:', error);
    throw new Error('Failed to initialize audit system');
  }
}

/**
 * Read all audit events from the JSON file
 */
export async function readAudits(): Promise<AuditEvent[]> {
  try {
    await ensureAuditFile();
    const data = await fs.readFile(AUDIT_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading audit logs:', error);
    throw new Error('Failed to read audit logs');
  }
}

/**
 * Write audit events to the JSON file using atomic write
 */
export async function writeAudits(events: AuditEvent[]): Promise<void> {
  try {
    await ensureAuditFile();
    
    const tempPath = AUDIT_FILE_PATH + '.tmp';
    const data = JSON.stringify(events, null, 2);
    
    // Write to temporary file first
    await fs.writeFile(tempPath, data, 'utf-8');
    
    // Atomically rename temp file to actual file
    await fs.rename(tempPath, AUDIT_FILE_PATH);
  } catch (error) {
    console.error('Error writing audit logs:', error);
    throw new Error('Failed to write audit logs');
  }
}

/**
 * Append a new audit event to the log
 */
export async function appendAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<AuditEvent> {
  try {
    const audits = await readAudits();
    
    const newEvent: AuditEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };
    
    // Sanitize details to remove sensitive information
    if (newEvent.details) {
      newEvent.details = sanitizeDetails(newEvent.details);
    }
    
    audits.push(newEvent);
    await writeAudits(audits);
    
    return newEvent;
  } catch (error) {
    console.error('Error appending audit event:', error);
    throw new Error('Failed to append audit event');
  }
}

/**
 * Sanitize details object to remove sensitive information
 */
function sanitizeDetails(details: Record<string, any>): Record<string, any> {
  const sanitized = { ...details };
  
  // Remove common sensitive fields
  const sensitiveFields = [
    'privateKey',
    'MINTER_PRIVATE_KEY',
    'secret',
    'password',
    'token',
    'signature',
    'rawTx',
    'signedTx'
  ];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  }
  
  // Recursively sanitize nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeDetails(value);
    }
  }
  
  return sanitized;
}

/**
 * Filter audit events based on criteria
 */
export function filterAudits(
  audits: AuditEvent[],
  filters: {
    from?: string;
    to?: string;
    type?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }
): { events: AuditEvent[]; total: number } {
  let filtered = [...audits];
  
  // Date range filter
  if (filters.from) {
    const fromDate = new Date(filters.from);
    filtered = filtered.filter(event => new Date(event.timestamp) >= fromDate);
  }
  
  if (filters.to) {
    const toDate = new Date(filters.to);
    filtered = filtered.filter(event => new Date(event.timestamp) <= toDate);
  }
  
  // Type filter
  if (filters.type) {
    filtered = filtered.filter(event => event.type === filters.type);
  }
  
  // Text search filter
  if (filters.q) {
    const query = filters.q.toLowerCase();
    filtered = filtered.filter(event => 
      event.type.toLowerCase().includes(query) ||
      event.actor?.toLowerCase().includes(query) ||
      event.user?.toLowerCase().includes(query) ||
      event.metadata?.toLowerCase().includes(query) ||
      JSON.stringify(event.details || {}).toLowerCase().includes(query)
    );
  }
  
  // Sort by timestamp (newest first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const total = filtered.length;
  
  // Pagination
  if (filters.offset || filters.limit) {
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    filtered = filtered.slice(offset, offset + limit);
  }
  
  return { events: filtered, total };
}

/**
 * Export audit events to CSV format
 */
export function exportAuditsToCSV(audits: AuditEvent[]): string {
  if (audits.length === 0) {
    return 'ID,Type,Actor,User,Details,IP,Metadata,Timestamp\n';
  }
  
  const headers = ['ID', 'Type', 'Actor', 'User', 'Details', 'IP', 'Metadata', 'Timestamp'];
  const rows = audits.map(event => [
    event.id,
    event.type,
    event.actor || '',
    event.user || '',
    JSON.stringify(event.details || {}),
    event.ip || '',
    event.metadata || '',
    event.timestamp
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
}

/**
 * Get audit event types for filtering
 */
export async function getAuditEventTypes(): Promise<string[]> {
  try {
    const audits = await readAudits();
    const types = new Set(audits.map(event => event.type));
    return Array.from(types).sort();
  } catch (error) {
    console.error('Error getting audit event types:', error);
    return [];
  }
}
