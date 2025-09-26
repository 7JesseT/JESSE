import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { EvidenceFile } from './refunds'

const UPLOADS_DIR = path.resolve(process.cwd(), 'public/uploads')
const DATA_UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads')

// Ensure upload directories exist
export const ensureUploadDirs = async (): Promise<void> => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
    await fs.mkdir(DATA_UPLOADS_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating upload directories:', error)
    throw new Error('Failed to create upload directories')
  }
}

// Get file extension from filename
const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase()
}

// Validate file type
const isValidFileType = (mimeType: string, filename: string): boolean => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain'
  ]
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt']
  const extension = getFileExtension(filename)
  
  return allowedTypes.includes(mimeType) && allowedExtensions.includes(extension)
}

// Generate unique filename
const generateUniqueFilename = (originalName: string): string => {
  const extension = getFileExtension(originalName)
  const timestamp = Date.now()
  const uuid = uuidv4().slice(0, 8)
  return `${timestamp}-${uuid}${extension}`
}

// Save file to disk
export const saveEvidenceFile = async (
  file: File,
  refundId: string,
  tags?: string[]
): Promise<EvidenceFile> => {
  await ensureUploadDirs()
  
  // Validate file
  if (!isValidFileType(file.type, file.name)) {
    throw new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP), PDF, and text files are allowed.')
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 10MB.')
  }
  
  // Generate unique filename
  const filename = generateUniqueFilename(file.name)
  const refundDir = path.join(DATA_UPLOADS_DIR, refundId)
  
  // Create refund-specific directory
  await fs.mkdir(refundDir, { recursive: true })
  
  // Save file
  const filePath = path.join(refundDir, filename)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fs.writeFile(filePath, buffer)
  
  // Create public URL (for demo, use data directory)
  const publicUrl = `/data/uploads/${refundId}/${filename}`
  
  // Create evidence file record
  const evidenceFile: EvidenceFile = {
    id: uuidv4(),
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    url: publicUrl,
    tags: tags || []
  }
  
  return evidenceFile
}

// Get evidence file
export const getEvidenceFile = async (
  refundId: string,
  filename: string
): Promise<Buffer | null> => {
  try {
    const filePath = path.join(DATA_UPLOADS_DIR, refundId, filename)
    return await fs.readFile(filePath)
  } catch (error) {
    console.error('Error reading evidence file:', error)
    return null
  }
}

// Delete evidence file
export const deleteEvidenceFile = async (
  refundId: string,
  filename: string
): Promise<boolean> => {
  try {
    const filePath = path.join(DATA_UPLOADS_DIR, refundId, filename)
    await fs.unlink(filePath)
    return true
  } catch (error) {
    console.error('Error deleting evidence file:', error)
    return false
  }
}

// Clean up old evidence files (for maintenance)
export const cleanupOldEvidence = async (olderThanDays: number = 90): Promise<number> => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
    
    let deletedCount = 0
    
    // Get all refund directories
    const refundDirs = await fs.readdir(DATA_UPLOADS_DIR)
    
    for (const refundDir of refundDirs) {
      const refundPath = path.join(DATA_UPLOADS_DIR, refundDir)
      const stat = await fs.stat(refundPath)
      
      if (stat.isDirectory() && stat.mtime < cutoffDate) {
        // Delete entire refund directory if old
        await fs.rm(refundPath, { recursive: true, force: true })
        deletedCount++
      }
    }
    
    return deletedCount
  } catch (error) {
    console.error('Error cleaning up old evidence:', error)
    return 0
  }
}

// Get file info for serving
export const getFileInfo = async (
  refundId: string,
  filename: string
): Promise<{ mimeType: string; size: number } | null> => {
  try {
    const filePath = path.join(DATA_UPLOADS_DIR, refundId, filename)
    const stat = await fs.stat(filePath)
    
    // Determine MIME type from extension
    const extension = getFileExtension(filename)
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    }
    
    return {
      mimeType: mimeTypes[extension] || 'application/octet-stream',
      size: stat.size
    }
  } catch (error) {
    console.error('Error getting file info:', error)
    return null
  }
}
