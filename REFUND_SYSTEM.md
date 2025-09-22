# Refund System Documentation

## Overview
The refund system allows buyers to request refunds for their transactions and enables admins to approve or deny these requests. The system includes comprehensive notification support and transaction tracking.

## Features

### For Buyers
- **Request Refunds**: Submit refund requests for eligible transactions
- **Track Status**: View refund request status (pending, approved, denied)
- **Notifications**: Receive notifications when refund status changes
- **Transaction History**: See refund information in transaction history

### For Admins
- **Review Requests**: View all refund requests in admin dashboard
- **Approve/Deny**: Process refund requests with admin notes
- **Automatic Processing**: Approved refunds automatically process blockchain transactions
- **Notifications**: Receive notifications for new refund requests and processing results

## API Endpoints

### GET /api/refund
Retrieve refund requests.

**Query Parameters:**
- `buyer` (string): Get refund requests for specific buyer
- `admin=true`: Get all refund requests (admin only)

**Response:**
```json
{
  "refundRequests": [
    {
      "id": "uuid",
      "transactionId": "string",
      "buyer": "wallet_address",
      "reason": "string",
      "status": "pending|approved|denied",
      "createdAt": "ISO_string",
      "processedAt": "ISO_string",
      "processedBy": "admin_wallet",
      "adminNotes": "string"
    }
  ]
}
```

### POST /api/refund
Create a new refund request.

**Headers:**
- `x-wallet-address`: Buyer's wallet address

**Body:**
```json
{
  "transactionId": "string",
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "refundRequest": { ... }
}
```

### PUT /api/refund
Process a refund request (approve/deny).

**Headers:**
- `x-wallet-address`: Admin's wallet address

**Body:**
```json
{
  "refundId": "string",
  "action": "approve|deny",
  "adminNotes": "string",
  "network": "mainnet|sepolia"
}
```

**Response:**
```json
{
  "success": true,
  "refundRequest": { ... },
  "refundTxHash": "string", // Only for approved refunds
  "transaction": { ... }    // Only for approved refunds
}
```

## Data Models

### RefundRequest
```typescript
interface RefundRequest {
  id: string
  transactionId: string
  buyer: string // wallet address
  reason: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
  processedAt?: string
  processedBy?: string // admin wallet that processed the refund
  adminNotes?: string // admin notes for approval/denial
}
```

## Business Rules

### Refund Eligibility
- Only transactions with status `confirmed`, `shipped`, or `delivered` can be refunded
- Pending transactions cannot be refunded
- Already refunded transactions cannot be refunded again
- Only one refund request per transaction is allowed

### Refund Processing
- **USDC Refunds**: Automatically processed via blockchain transaction
- **ETH Refunds**: Currently not supported (would require different logic)
- **Admin Approval**: Required for all refunds
- **Admin Notes**: Required for all refund decisions

## Notifications

### Buyer Notifications
- **Refund Request Submitted**: Confirmation when request is created
- **Refund Processed**: Success notification when refund is approved and processed
- **Refund Denied**: Warning notification when refund is denied

### Admin Notifications
- **New Refund Request**: Warning notification for new requests
- **Refund Approved**: Success notification when refund is processed
- **Refund Denied**: Info notification when refund is denied

## UI Components

### Buyer Interface
- **Transaction History Page**: Shows refund status and request button
- **Refund Request Dialog**: Modal for submitting refund requests
- **Status Indicators**: Visual indicators for refund status

### Admin Interface
- **Refund Management Page**: Lists all refund requests
- **Action Buttons**: Approve/Deny buttons for each request
- **Admin Notes**: Required field for all decisions
- **Transaction Details**: Links to original transactions

## File Structure

```
app/
├── api/refund/route.ts          # Refund API endpoints
├── admin/refunds/page.tsx      # Admin refund management
├── transactions/page.tsx        # Buyer transaction history
lib/
├── refunds.ts                  # Refund data management
├── types/notifications.ts     # Notification templates
data/
└── refunds.json               # Refund data storage
```

## Security Considerations

- **Wallet Verification**: All requests verify wallet ownership
- **Admin Authorization**: Admin actions require admin wallet verification
- **Transaction Validation**: Refund requests validate against original transactions
- **Balance Checks**: Refund processing checks admin wallet balance

## Future Enhancements

- **ETH Refund Support**: Add support for ETH refunds
- **Partial Refunds**: Support for partial refund amounts
- **Refund Policies**: Configurable refund policies and time limits
- **Email Notifications**: Email notifications in addition to in-app notifications
- **Refund Analytics**: Detailed analytics and reporting for refunds
- **Automated Refunds**: Automatic refund processing for certain conditions
