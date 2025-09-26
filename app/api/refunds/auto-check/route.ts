import { NextRequest, NextResponse } from 'next/server'
import { 
  getEligibleForAutoRefund, 
  markAutoRefundChecked,
  updateRefundStatus 
} from '@/lib/refunds'
import { getTransactionById } from '@/lib/transactions'
import { getAutoRefundRecommendation } from '@/lib/auto-refund-rules'
import { appendAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const { network = 'sepolia', dryRun = false } = await request.json()
    
    // Get admin wallet for processing
    const adminWallet = request.headers.get('x-wallet-address') || '0x1234567890123456789012345678901234567890'
    
    // Get all refund requests eligible for auto-refund check
    const eligibleRefunds = await getEligibleForAutoRefund()
    
    if (eligibleRefunds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No refund requests eligible for auto-refund check',
        processed: 0,
        autoRefunded: 0,
        results: []
      })
    }
    
    const results = []
    let autoRefundedCount = 0
    
    for (const refundRequest of eligibleRefunds) {
      try {
        // Get transaction details
        const transaction = await getTransactionById(refundRequest.transactionId)
        if (!transaction) {
          results.push({
            refundId: refundRequest.id,
            status: 'skipped',
            reason: 'Transaction not found',
            recommendation: null
          })
          continue
        }
        
        // Get auto-refund recommendation
        const recommendation = await getAutoRefundRecommendation(
          refundRequest,
          transaction,
          network as any
        )
        
        // Mark as checked
        await markAutoRefundChecked(refundRequest.id)
        
        if (recommendation.recommended && !dryRun) {
          // Process auto-refund
          try {
            // Call the existing process-refund endpoint
            const processResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/process-refund`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-wallet-address': adminWallet
              },
              body: JSON.stringify({
                refundId: refundRequest.id,
                action: 'approve',
                adminNotes: `Auto-refunded based on rules: ${recommendation.reason}`,
                network
              })
            })
            
            const processData = await processResponse.json()
            
            if (processResponse.ok) {
              // Update status to auto_refunded
              await updateRefundStatus(
                refundRequest.id,
                'auto_refunded',
                adminWallet,
                `Auto-refunded based on rules: ${recommendation.reason}`
              )
              
              autoRefundedCount++
              
              results.push({
                refundId: refundRequest.id,
                status: 'auto_refunded',
                reason: recommendation.reason,
                confidence: recommendation.confidence,
                recommendation: recommendation.details,
                refundTxHash: processData.refundTxHash,
                burnTxHash: processData.burnTxHash
              })
              
              // Create audit log for auto-refund
              try {
                await appendAudit({
                  type: 'auto_refund_processed',
                  actor: adminWallet,
                  user: refundRequest.buyer,
                  details: {
                    refundId: refundRequest.id,
                    transactionId: refundRequest.transactionId,
                    confidence: recommendation.confidence,
                    matchedRules: recommendation.details.matchedRules,
                    totalWeight: recommendation.details.totalWeight,
                    refundTxHash: processData.refundTxHash,
                    burnTxHash: processData.burnTxHash
                  },
                  metadata: `Auto-refund processed for ${refundRequest.id}: ${recommendation.reason}`
                })
              } catch (auditError) {
                console.error('Failed to create auto-refund audit log:', auditError)
              }
              
              // Trigger notification for buyer about auto-refund
              try {
                await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    type: 'success',
                    category: 'refund',
                    title: 'Auto-Refund Processed',
                    message: `Your refund request has been automatically processed and approved.`,
                    autoDismiss: true,
                    dismissAfter: 5000,
                  }),
                })
              } catch (notificationError) {
                console.error('Failed to send auto-refund notification:', notificationError)
              }
              
            } else {
              results.push({
                refundId: refundRequest.id,
                status: 'failed',
                reason: `Failed to process refund: ${processData.error}`,
                recommendation: recommendation.details
              })
            }
            
          } catch (processError) {
            console.error('Error processing auto-refund:', processError)
            results.push({
              refundId: refundRequest.id,
              status: 'failed',
              reason: `Processing error: ${processError instanceof Error ? processError.message : 'Unknown error'}`,
              recommendation: recommendation.details
            })
          }
          
        } else {
          // Not eligible for auto-refund
          results.push({
            refundId: refundRequest.id,
            status: 'not_eligible',
            reason: recommendation.reason,
            confidence: recommendation.confidence,
            recommendation: recommendation.details
          })
        }
        
      } catch (error) {
        console.error(`Error processing refund ${refundRequest.id}:`, error)
        results.push({
          refundId: refundRequest.id,
          status: 'error',
          reason: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recommendation: null
        })
      }
    }
    
    // Create audit log for auto-check run
    try {
      await appendAudit({
        type: 'auto_refund_check_run',
        actor: adminWallet,
        user: adminWallet,
        details: {
          totalChecked: eligibleRefunds.length,
          autoRefunded: autoRefundedCount,
          network,
          dryRun,
          results: results.map(r => ({
            refundId: r.refundId,
            status: r.status,
            reason: r.reason
          }))
        },
        metadata: `Auto-refund check completed: ${autoRefundedCount}/${eligibleRefunds.length} auto-refunded`
      })
    } catch (auditError) {
      console.error('Failed to create auto-check audit log:', auditError)
    }
    
    return NextResponse.json({
      success: true,
      message: `Auto-refund check completed${dryRun ? ' (dry run)' : ''}`,
      processed: eligibleRefunds.length,
      autoRefunded: autoRefundedCount,
      network,
      dryRun,
      results
    })
    
  } catch (error) {
    console.error('Auto-refund check error:', error)
    
    return NextResponse.json(
      { error: 'Failed to run auto-refund check' },
      { status: 500 }
    )
  }
}

// GET endpoint for checking status without processing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const network = searchParams.get('network') || 'sepolia'
    
    // Get all refund requests eligible for auto-refund check
    const eligibleRefunds = await getEligibleForAutoRefund()
    
    const results = []
    
    for (const refundRequest of eligibleRefunds) {
      try {
        // Get transaction details
        const transaction = await getTransactionById(refundRequest.transactionId)
        if (!transaction) {
          results.push({
            refundId: refundRequest.id,
            status: 'skipped',
            reason: 'Transaction not found',
            recommendation: null
          })
          continue
        }
        
        // Get auto-refund recommendation
        const recommendation = await getAutoRefundRecommendation(
          refundRequest,
          transaction,
          network as any
        )
        
        results.push({
          refundId: refundRequest.id,
          transactionId: refundRequest.transactionId,
          buyer: refundRequest.buyer,
          reason: refundRequest.reason,
          status: refundRequest.status,
          createdAt: refundRequest.createdAt,
          evidenceCount: refundRequest.evidence?.length || 0,
          recommendation: recommendation.recommended,
          confidence: recommendation.confidence,
          details: recommendation.details
        })
        
      } catch (error) {
        console.error(`Error checking refund ${refundRequest.id}:`, error)
        results.push({
          refundId: refundRequest.id,
          status: 'error',
          reason: `Check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recommendation: null
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Auto-refund eligibility check completed',
      total: eligibleRefunds.length,
      network,
      results
    })
    
  } catch (error) {
    console.error('Auto-refund check error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check auto-refund eligibility' },
      { status: 500 }
    )
  }
}
