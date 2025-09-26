# Simple Test Commands for Dispute Resolution System

## Test 1: Create Refund Request with Evidence Support

```bash
curl -X POST http://localhost:3000/api/request-refund \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "seed-13-0",
    "reason": "Duplicate purchase - will provide evidence",
    "buyerAddress": "0xtest123456789012345678901234567890123456"
  }'
```

Expected: Returns refund request with `status: "pending"` and new fields like `evidence: []`, `updatedAt`

## Test 2: Check Auto-Refund Eligibility (Dry Run)

```bash
curl -X GET "http://localhost:3000/api/refunds/auto-check?network=sepolia"
```

Expected: Returns list of refunds eligible for auto-refund checking

## Test 3: Run Auto-Refund Check (Dry Run)

```bash
curl -X POST http://localhost:3000/api/refunds/auto-check \
  -H "Content-Type: application/json" \
  -d '{
    "network": "sepolia",
    "dryRun": true
  }'
```

Expected: Shows what would be auto-refunded without actually processing

## Test 4: Upload Evidence (using HTML form)

Create a simple HTML file to test file upload:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Evidence Upload</title>
</head>
<body>
    <h2>Upload Evidence</h2>
    <form action="http://localhost:3000/api/upload-evidence" method="post" enctype="multipart/form-data">
        <input type="hidden" name="refundId" value="YOUR_REFUND_ID_HERE">
        <input type="text" name="tags" placeholder="duplicate,test" value="duplicate,test">
        <input type="file" name="files" multiple accept="image/*,.pdf,.txt">
        <button type="submit">Upload Evidence</button>
    </form>
</body>
</html>
```

## Test 5: Check Updated Refund Status

After uploading evidence, the refund status should change to "under_review"

```bash
# Check the refunds.json file
cat data/refunds.json | grep -A 20 "YOUR_REFUND_ID"
```

## Verification Steps

1. **Check refunds.json**: Should contain new fields (`evidence`, `updatedAt`, etc.)
2. **Check audit-logs.json**: Should contain new audit events
3. **Check evidence files**: Should be stored in `/data/uploads/{refundId}/`
4. **Test admin interface**: Go to `/admin/refunds` and verify evidence display
5. **Test buyer interface**: Go to `/refunds` and verify timeline/evidence display

## Expected Behavior

1. **New refund request**: Status = "pending"
2. **After evidence upload**: Status = "under_review" 
3. **Admin review**: Can view evidence inline, approve/deny with notes
4. **Auto-refund**: Rules engine evaluates and can auto-process eligible refunds
5. **Notifications**: Users and admins get appropriate notifications
6. **Audit logs**: All actions are logged with detailed information

## File Structure After Testing

```
data/
├── refunds.json (updated with new fields)
├── audit-logs.json (new events logged)
└── uploads/
    └── {refundId}/
        └── uploaded-evidence-files
```

## Common Issues & Solutions

1. **Evidence upload fails**: Check file size (max 10MB) and type (images, PDF, text only)
2. **Auto-refund not working**: Verify transaction exists and meets rule criteria
3. **Status not updating**: Check API responses for error messages
4. **Files not found**: Ensure `/data/uploads/` directory has proper permissions

## Success Criteria

✅ Refund requests created with new data model
✅ Evidence upload working and files stored
✅ Admin interface shows evidence for review  
✅ Auto-refund rules engine evaluates requests correctly
✅ Notifications sent for all status changes
✅ Audit logs capture all dispute workflow events
✅ Buyer and admin UIs updated for new features
