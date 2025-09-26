import { NextRequest, NextResponse } from 'next/server'
import { saveEvidenceFile } from '@/lib/evidence-storage'
import { addEvidenceToRefund, getRefundRequestById } from '@/lib/refunds'
import { appendAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const refundId = formData.get('refundId') as string
    const tags = formData.get('tags') as string
    const files = formData.getAll('files') as File[]
    
    // Validate required fields
    if (!refundId || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: refundId, files' },
        { status: 400 }
      )
    }
    
    // Get refund request
    const refundRequest = await getRefundRequestById(refundId)
    if (!refundRequest) {
      return NextResponse.json(
        { error: 'Refund request not found' },
        { status: 404 }
      )
    }
    
    // Check if refund is still eligible for evidence
    if (refundRequest.status === 'approved' || refundRequest.status === 'denied' || refundRequest.status === 'auto_refunded') {
      return NextResponse.json(
        { error: 'Cannot add evidence to processed refund request' },
        { status: 400 }
      )
    }
    
    // Parse tags
    const evidenceTags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
    
    // Save evidence files
    const evidenceFiles = []
    for (const file of files) {
      try {
        const evidenceFile = await saveEvidenceFile(file, refundId, evidenceTags)
        evidenceFiles.push(evidenceFile)
      } catch (error) {
        console.error('Error saving evidence file:', error)
        return NextResponse.json(
          { error: `Failed to save file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 400 }
        )
      }
    }
    
    // Add evidence to refund request
    const updatedRefund = await addEvidenceToRefund(refundId, evidenceFiles)
    if (!updatedRefund) {
      return NextResponse.json(
        { error: 'Failed to update refund request with evidence' },
        { status: 500 }
      )
    }
    
    // Create audit log
    try {
      await appendAudit({
        type: 'refund_evidence_uploaded',
        actor: refundRequest.buyer,
        user: refundRequest.buyer,
        details: {
          refundId,
          transactionId: refundRequest.transactionId,
          evidenceCount: evidenceFiles.length,
          evidenceFiles: evidenceFiles.map(f => ({
            id: f.id,
            filename: f.filename,
            originalName: f.originalName,
            size: f.size,
            tags: f.tags
          }))
        },
        metadata: `Evidence uploaded for refund request ${refundId}: ${evidenceFiles.length} files`
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
    }
    
    // Trigger notifications
    try {
      // Notify buyer that evidence was uploaded successfully
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'success',
          category: 'refund',
          title: 'Evidence Uploaded',
          message: `Your evidence has been uploaded successfully. Your refund request is now under review.`,
          autoDismiss: true,
          dismissAfter: 5000,
        }),
      })

      // Notify admin about new evidence
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'warning',
          category: 'admin',
          title: 'Evidence Requires Review',
          message: `📎 New evidence uploaded for refund ${refundId.slice(0, 8)}... by ${refundRequest.buyer.slice(0, 6)}...${refundRequest.buyer.slice(-4)} - Status: Under Review`,
          autoDismiss: false,
        }),
      })
    } catch (notificationError) {
      console.error('Failed to send evidence notifications:', notificationError)
    }
    
    return NextResponse.json({
      success: true,
      refundRequest: updatedRefund,
      evidenceFiles
    })
    
  } catch (error) {
    console.error('Evidence upload error:', error)
    
    return NextResponse.json(
      { error: 'Failed to upload evidence' },
      { status: 500 }
    )
  }
}
