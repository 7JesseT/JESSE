# Day 25 — Refund System & NFT Burn 🔥

## Overview
A comprehensive refund system that allows buyers to request refunds for their purchases. When approved by an admin, the system automatically:
1. **Returns USDC payments** to the buyer's wallet
2. **Burns the purchased NFT** to prevent reuse
3. **Logs all actions** in the audit system

## Features

### 🔄 Refund Workflow
- **Buyer Request**: Submit refund requests via `/api/request-refund`
- **Admin Review**: Admins review requests in `/admin/refunds`
- **Automatic Processing**: Approved refunds trigger:
  - USDC transfer back to buyer
  - NFT burning (if applicable)
  - Transaction status update
  - Audit logging

### 🔥 NFT Burning
- **Smart Contract Integration**: Uses ERC-1155 `burn()` function
- **Owner-Only Burning**: Only contract owner (admin) can burn tokens
- **Balance Verification**: Checks buyer has sufficient NFT balance
- **Transaction Tracking**: All burn transactions are logged

### 📊 Admin Dashboard
- **Request Management**: View all refund requests with filtering
- **Transaction Details**: See original purchase details and NFT info
- **Action Buttons**: Approve/Deny with required admin notes
- **Real-time Updates**: Live status updates and transaction hashes

## API Endpoints

### POST /api/request-refund
Create a new refund request.

**Request Body:**
```json
{
  "transactionId": "string",
  "reason": "string",
  "buyerAddress": "0x..." // optional
}
```

**Response:**
```json
{
  "success": true,
  "refundRequest": {
    "id": "uuid",
    "transactionId": "string",
    "buyer": "0x...",
    "reason": "string",
    "status": "pending",
    "createdAt": "ISO_string"
  }
}
```

### POST /api/process-refund
Process a refund request (approve/deny).

**Request Body:**
```json
{
  "refundId": "string",
  "action": "approve|deny",
  "adminNotes": "string",
  "network": "sepolia|mainnet" // optional, defaults to sepolia
}
```

**Response (Approved):**
```json
{
  "success": true,
  "refundRequest": { ... },
  "refundTxHash": "0x...", // USDC refund transaction
  "burnTxHash": "0x...",   // NFT burn transaction (if applicable)
  "transaction": { ... }   // Updated transaction record
}
```

## Smart Contract Updates

### AttendanceNFT.sol
Added burn functionality to the ERC-1155 contract:

```solidity
// Burn function for refunds - only owner can burn tokens
function burn(address from, uint256 id, uint256 amount) public onlyOwner {
    require(from != address(0), "ERC1155: burn from the zero address");
    require(amount > 0, "ERC1155: burn amount must be greater than 0");
    
    // Check if the owner has enough tokens to burn
    require(balanceOf(from, id) >= amount, "ERC1155: burn amount exceeds balance");
    
    _burn(from, id, amount);
}

// Batch burn function for multiple tokens
function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) public onlyOwner {
    require(from != address(0), "ERC1155: burn from the zero address");
    require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
    
    for (uint256 i = 0; i < ids.length; i++) {
        require(balanceOf(from, ids[i]) >= amounts[i], "ERC1155: burn amount exceeds balance");
    }
    
    _burnBatch(from, ids, amounts);
}
```

## Data Models

### Transaction Types
Extended transaction types to support NFT purchases:

```typescript
type TransactionType = 'tip' | 'nft_mint' | 'nft_purchase' | 'file_purchase' | 'special_reward'
```

### Transaction Metadata
Added NFT-specific metadata fields:

```typescript
interface Transaction {
  // ... existing fields
  metadata?: {
    recipientId?: string      // for tips
    fileId?: string          // for file purchases
    event?: string           // for NFT mints
    tokenId?: string         // for NFT mints/purchases
    contractAddress?: string // for NFT purchases
    tokenAmount?: number     // for NFT purchases (quantity)
  }
}
```

### Refund Request
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

## Pages & UI

### /admin/refunds
Admin dashboard for managing refund requests:
- **Table View**: All refund requests with transaction details
- **Transaction Type Column**: Shows whether it's a file purchase or NFT purchase
- **Action Buttons**: Approve/Deny with admin notes requirement
- **Transaction Links**: Direct links to Basescan for original purchases
- **Status Tracking**: Real-time status updates

### /nft-purchase
Demo page for testing NFT purchases and refunds:
- **NFT Marketplace**: Sample NFTs with different prices
- **Purchase Flow**: Simulated NFT purchase process
- **Refund Testing**: Request refunds to test the burning system
- **Transaction Display**: Shows purchase and refund transaction hashes

## Security Features

### 🔒 Access Control
- **Admin-Only Actions**: Only admin wallet can process refunds
- **Owner-Only Burning**: Only contract owner can burn NFTs
- **Balance Verification**: Checks NFT ownership before burning

### 📝 Audit Logging
All refund actions are logged with:
- **Refund Requests**: When buyers submit requests
- **Refund Processing**: When admins approve/deny requests
- **Transaction Details**: USDC refund and NFT burn transaction hashes
- **Admin Actions**: Who processed the refund and when

### ⚠️ Error Handling
- **Balance Checks**: Verifies admin has sufficient USDC for refunds
- **NFT Ownership**: Confirms buyer owns the NFT before burning
- **Transaction Validation**: Ensures all blockchain transactions succeed
- **Rollback Support**: Reverts refund status if processing fails

## Testing the System

### 1. NFT Purchase Flow
1. Visit `/nft-purchase`
2. Connect wallet
3. Click "Purchase NFT" on any item
4. Verify transaction is created

### 2. Refund Request Flow
1. Click "Request Refund" on purchased NFT
2. Provide reason for refund
3. Verify refund request is created

### 3. Admin Processing Flow
1. Visit `/admin/refunds`
2. See pending refund requests
3. Click "Approve" or "Deny"
4. Add admin notes
5. Verify processing results

### 4. Verification Steps
- **USDC Refund**: Check admin wallet USDC balance decreases
- **NFT Burning**: Verify NFT balance decreases for buyer
- **Audit Logs**: Check `/admin/audit` for refund events
- **Transaction Status**: Verify transaction marked as "refunded"

## Environment Variables

```env
# Admin private key for processing refunds and burning NFTs
ADMIN_PRIVATE_KEY=your_admin_private_key

# NFT contract address
NEXT_PUBLIC_ATTENDANCE_CONTRACT=0x...

# USDC contract addresses
NEXT_PUBLIC_USDC_ADDRESS=0x... # Base Sepolia
# USDC_ADDRESS_MAINNET=0x... # Base Mainnet

# Base URL for API calls
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## File Structure

```
app/
├── api/
│   ├── request-refund/route.ts    # Create refund requests
│   └── process-refund/route.ts   # Process refunds (approve/deny)
├── admin/
│   └── refunds/page.tsx          # Admin refund management
└── nft-purchase/page.tsx         # NFT purchase demo

contracts/
└── AttendanceNFT.sol             # Updated with burn functions

lib/
├── contracts.ts                  # Updated ABI with burn functions
├── transactions.ts               # Extended with NFT purchase support
└── refunds.ts                    # Refund data management

data/
├── refunds.json                  # Refund request storage
└── transactions.json             # Transaction records
```

## Production Considerations

### 🔧 Smart Contract Deployment
- Deploy updated `AttendanceNFT.sol` with burn functions
- Update `NEXT_PUBLIC_ATTENDANCE_CONTRACT` environment variable
- Ensure admin wallet has contract ownership

### 💰 USDC Management
- Admin wallet needs sufficient USDC balance for refunds
- Consider implementing USDC top-up mechanisms
- Monitor USDC balance and set up alerts

### 🔐 Security
- Use secure admin private key storage
- Implement proper access controls
- Regular security audits of refund processes
- Consider multi-signature requirements for large refunds

### 📊 Monitoring
- Track refund request volumes
- Monitor USDC refund amounts
- Log all NFT burning events
- Set up alerts for failed transactions

## Future Enhancements

### 🚀 Planned Features
- **Partial Refunds**: Support for partial USDC refunds
- **Batch Processing**: Process multiple refunds at once
- **Refund Policies**: Configurable refund rules and time limits
- **Email Notifications**: Email alerts for refund status changes
- **Analytics Dashboard**: Detailed refund analytics and reporting

### 🔄 Integration Opportunities
- **Payment Processors**: Integration with Stripe, PayPal, etc.
- **Inventory Management**: Automatic inventory updates on refunds
- **Customer Support**: Integration with support ticket systems
- **Accounting Systems**: Export refund data for accounting

---

## Summary

The refund system with NFT burning provides a complete solution for handling customer refunds in an NFT marketplace. It ensures that:

✅ **USDC payments are returned** to buyers  
✅ **NFTs are permanently burned** to prevent reuse  
✅ **All actions are audited** for compliance  
✅ **Admins have full control** over the refund process  
✅ **The system is secure** and prevents abuse  

This implementation demonstrates best practices for handling refunds in Web3 applications while maintaining the integrity of the NFT ecosystem.
