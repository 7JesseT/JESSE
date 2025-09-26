import { NextRequest, NextResponse } from 'next/server'
import { getEvidenceFile, getFileInfo } from '@/lib/evidence-storage'
import { getRefundRequestById } from '@/lib/refunds'

export async function GET(
  request: NextRequest,
  { params }: { params: { refundId: string; filename: string } }
) {
  try {
    const { refundId, filename } = params
    
    // Get refund request to verify it exists
    const refundRequest = await getRefundRequestById(refundId)
    if (!refundRequest) {
      return NextResponse.json(
        { error: 'Refund request not found' },
        { status: 404 }
      )
    }
    
    // Get file info
    const fileInfo = await getFileInfo(refundId, filename)
    if (!fileInfo) {
      return NextResponse.json(
        { error: 'Evidence file not found' },
        { status: 404 }
      )
    }
    
    // Get file content
    const fileBuffer = await getEvidenceFile(refundId, filename)
    if (!fileBuffer) {
      return NextResponse.json(
        { error: 'Failed to read evidence file' },
        { status: 500 }
      )
    }
    
    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': fileInfo.mimeType,
        'Content-Length': fileInfo.size.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Disposition': `inline; filename="${filename}"`
      }
    })
    
  } catch (error) {
    console.error('Evidence file serving error:', error)
    
    return NextResponse.json(
      { error: 'Failed to serve evidence file' },
      { status: 500 }
    )
  }
}
