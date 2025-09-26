# Dispute Resolution & Auto-Refunds System

This document describes the enhanced refund system with dispute resolution workflow, evidence uploads, admin review interface, and auto-refund capabilities.

## Overview

The dispute resolution system extends the existing refund system with:
- Evidence upload capabilities for buyers
- Admin review interface with evidence viewing
- Auto-refund rules engine
- Enhanced notifications and audit logging
- Timeline tracking and status management

## Data Model Extensions

### RefundRequest Interface
```typescript
interface RefundRequest {
  id: string
  transactionId: string
  buyer: string
  reason: string
  status: 'pending' | 'under_review' | 'approved' | 'denied' | 'auto_refunded'
  createdAt: string
  processedAt?: string
  processedBy?: string
  adminNotes?: string
  evidence?: EvidenceFile[]
  updatedAt?: string
  autoRefundCheckedAt?: string
}
```

### EvidenceFile Interface
```typescript
interface EvidenceFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  uploadedAt: string
  url: string
  tags?: string[] // e.g., ['duplicate', 'failed_delivery', 'technical_issue']
}
```

## Buyer Flow

### 1. Request Refund with Evidence
```bash
# Basic refund request
curl -X POST http://localhost:3000/api/request-refund \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "seed-1-0",
    "reason": "Product not as described",
    "buyerAddress": "0x1234567890123456789012345678901234567890"
  }'
```

### 2. Upload Evidence
```bash
# Upload evidence files (multipart form)
curl -X POST http://localhost:3000/api/upload-evidence \
  -F "refundId=your-refund-id" \
  -F "tags=duplicate,technical_issue" \
  -F "files=@screenshot.png" \
  -F "files=@receipt.pdf"
```

### 3. Check Refund Status
Access `/refunds` page to view:
- Refund timeline with status updates
- Evidence files with inline viewing
- Estimated response times
- Admin notes when processed

## Admin Flow

### 1. Review Refund Requests
Access `/admin/refunds` to:
- View all refund requests with enhanced details
- Filter by status (pending, under_review, approved, denied, auto_refunded)
- Click "Review" to see detailed evidence

### 2. Review Evidence
The admin review dialog shows:
- Transaction details
- Refund reason
- Evidence files with view/download options
- Evidence tags for categorization
- Admin notes field for decision rationale

### 3. Approve/Deny Decisions
```bash
# Process refund decision
curl -X POST http://localhost:3000/api/process-refund \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: 0xadmin..." \
  -d '{
    "refundId": "your-refund-id",
    "action": "approve",
    "adminNotes": "Valid evidence provided, approving refund",
    "network": "sepolia"
  }'
```

## Auto-Refund System

### Rules Engine
The auto-refund system uses configurable rules to automatically process refunds when certain conditions are met:

1. **Duplicate Purchase Evidence** (90% weight)
   - Evidence tagged with "duplicate"
   
2. **Failed Delivery Evidence** (85% weight)
   - Evidence tagged with "failed_delivery"
   
3. **Transaction Failed** (95% weight)
   - On-chain verification of failed transaction
   
4. **Mint Reverted** (95% weight)
   - NFT mint transaction reverted on-chain

### Auto-Check Endpoint

#### Dry Run (Check Eligibility)
```bash
curl -X GET "http://localhost:3000/api/refunds/auto-check?network=sepolia"
```

#### Process Auto-Refunds
```bash
curl -X POST http://localhost:3000/api/refunds/auto-check \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: 0xadmin..." \
  -d '{
    "network": "sepolia",
    "dryRun": false
  }'
```

#### Dry Run Mode
```bash
curl -X POST http://localhost:3000/api/refunds/auto-check \
  -H "Content-Type: application/json" \
  -d '{
    "network": "sepolia",
    "dryRun": true
  }'
```

## Evidence Storage

### Local Storage (Development)
- Evidence files stored in `/data/uploads/{refundId}/`
- Public URL: `/data/uploads/{refundId}/{filename}`
- **⚠️ Warning**: Vercel has ephemeral storage - files may be lost on deployments

### Production Recommendations
For production deployment, integrate with cloud storage:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

Update `lib/evidence-storage.ts` to use cloud storage APIs instead of local filesystem.

## File Serving

Evidence files are served through:
```
GET /api/evidence/[refundId]/[filename]
```

This endpoint:
- Validates refund request exists
- Serves files with appropriate MIME types
- Includes cache headers
- Supports inline viewing for images/PDFs

## Status Flow

```
pending → under_review → approved/denied
                      ↘ auto_refunded
```

### Status Descriptions
- **pending**: Initial state, awaiting review
- **under_review**: Evidence provided, requires admin review
- **approved**: Admin approved, refund processed
- **denied**: Admin denied with reasoning
- **auto_refunded**: Automatically processed by rules engine

## Notifications

### Buyer Notifications
- Refund request submitted
- Evidence uploaded successfully
- Status change to under review
- Refund approved/denied
- Auto-refund processed

### Admin Notifications
- New refund request
- New evidence uploaded
- Evidence requires review

## Audit Logging

All actions are logged with detailed information:
- `refund_request`: New refund request
- `refund_evidence_uploaded`: Evidence uploaded
- `refund_processed`: Manual refund processing
- `auto_refund_processed`: Auto-refund execution
- `auto_refund_check_run`: Auto-check batch run

## Testing Commands

### 1. Create Test Refund Request
```bash
curl -X POST http://localhost:3000/api/request-refund \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "seed-13-0",
    "reason": "Duplicate purchase - evidence attached",
    "buyerAddress": "0xtest123456789012345678901234567890123456"
  }'
```

### 2. Upload Test Evidence
```bash
# Create a test file
echo "This is test evidence for duplicate purchase" > test-evidence.txt

# Upload it
curl -X POST http://localhost:3000/api/upload-evidence \
  -F "refundId=YOUR_REFUND_ID" \
  -F "tags=duplicate,test" \
  -F "files=@test-evidence.txt"
```

### 3. Check Auto-Refund Eligibility
```bash
curl -X GET "http://localhost:3000/api/refunds/auto-check?network=sepolia"
```

### 4. Run Auto-Refund Check (Dry Run)
```bash
curl -X POST http://localhost:3000/api/refunds/auto-check \
  -H "Content-Type: application/json" \
  -d '{
    "network": "sepolia",
    "dryRun": true
  }'
```

### 5. Process Auto-Refund
```bash
curl -X POST http://localhost:3000/api/refunds/auto-check \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: 0x1234567890123456789012345678901234567890" \
  -d '{
    "network": "sepolia",
    "dryRun": false
  }'
```

## Verification Steps

After running the commands above:

1. **Check refunds.json** for new entries
2. **Check audit-logs.json** for logged events
3. **Verify evidence files** in `/data/uploads/`
4. **Test admin interface** at `/admin/refunds`
5. **Test buyer interface** at `/refunds`
6. **Check notifications** appear correctly

## Security Considerations

1. **File Upload Validation**
   - File type restrictions (images, PDF, text only)
   - File size limits (10MB max)
   - Filename sanitization

2. **Access Control**
   - Evidence files only accessible via refund validation
   - Admin functions require authorization
   - Audit logging for all actions

3. **Data Integrity**
   - Atomic file operations
   - Error handling and rollback
   - Evidence immutability once uploaded

## Performance Notes

1. **File Storage**
   - Evidence files stored locally for demo
   - Use cloud storage for production
   - Implement cleanup for old evidence

2. **Auto-Refund Checks**
   - Run periodically via cron job
   - Batch processing for efficiency
   - Rate limiting for on-chain calls

## Error Handling

The system includes comprehensive error handling for:
- Invalid file uploads
- Network connectivity issues
- On-chain transaction failures
- Storage system failures
- Audit logging failures

All errors are logged and user-friendly messages are returned to the frontend.
