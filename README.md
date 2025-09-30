
# Base Daily

Base Daily is a production-ready Next.js 14 application showcasing comprehensive onchain interactions on Base. Built with TypeScript, Tailwind CSS, wagmi/viem, and OnchainKit, it features a complete paywall system, invite links, VIP access, analytics, refunds, audit logs, and shipment tracking.

## Architecture

A modern full-stack dApp with Next.js 14 App Router, server-side payment verification, JSON-based data persistence, and comprehensive admin tooling for managing onchain interactions.

### Highlights
- **Wallet persistence**: Auto-reconnects on reload using localStorage + Wagmi `autoConnect`.
- **Mobile + Desktop**: WalletConnect v2, MetaMask, and Coinbase Wallet supported.
- **Tip Jar with Recipients**: Send native ETH or USDC to Env Club, AI Club, or Dev Club with live tracking.
- **Transaction Tracking**: Real-time totals by recipient with transaction history and Basescan links.
- **Daily automation**: Ships 1 feature and processes 1 transaction after wallet connect
ion each day.
- **Mainnet Flip**: Robust network toggle between Base Sepolia (testnet) and Base Mainnet with safety features.
- **Modern stack**: Next.js 14, React 18, Wagmi, Viem, OnchainKit, Tailwind.

---

## Mainnet Flip Feature

### Overview
A robust network toggle system that allows the app to run on both Base Sepolia (testnet) and Base Mainnet with comprehensive safety features. Users can switch between networks with a single toggle, but mainnet transactions require explicit confirmation and balance checks to prevent accidental real-fund payments.

### Key Features
- **Network Toggle**: Switch between Sepolia and Mainnet without reload
- **Balance Checks**: Automatic ETH/USDC balance validation for mainnet transactions
- **Mainnet Confirmation**: Required "CONFIRM MAINNET" typing for real-fund transactions
- **Safety Warnings**: Clear visual indicators for mainnet vs testnet operations
- **Session Persistence**: Network preference and confirmation state persist across sessions
- **Server-side Verification**: API endpoints support both networks with proper RPC routing

### Safety Features
- **Low Balance Warning**: Blocks mainnet transactions if ETH balance < $2 worth
- **USDC Balance Check**: Validates USDC balance for USDC transactions on mainnet
- **Confirmation Modal**: Requires typing "CONFIRM MAINNET" to enable mainnet sending
- **Session TTL**: Mainnet confirmation expires after 24 hours for security
- **Visual Indicators**: Red warnings and "REAL FUNDS" labels for mainnet operations

### Environment Variables
```env
# Network Configuration
NEXT_PUBLIC_RPC_URL_SEPOLIA=https://sepolia.base.org
NEXT_PUBLIC_RPC_URL_MAINNET=https://mainnet.base.org
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia

# Legacy support (backward compatibility)
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

## Day 26 — Analytics

### Overview
The analytics system provides comprehensive metrics and insights for the platform. It includes server-side metric endpoints, an improved admin dashboard, demo data seeding, CSV export functionality, and performance caching.

### Features
- **Server Metric Endpoints**: RESTful APIs for summary and daily metrics
- **Admin Dashboard**: Enhanced analytics page with summary cards and charts
- **Demo Data Seeding**: Generate realistic fake data for development and testing
- **CSV Export**: Download analytics data as CSV files
- **Performance Caching**: In-memory caching with 30-second TTL for fast responses
- **Error Handling**: Graceful handling of missing or malformed data files

### API Endpoints

#### GET /api/admin/metrics/summary
Get summary metrics for a date range:
```bash
curl "http://localhost:3000/api/admin/metrics/summary?from=2025-01-01&to=2025-01-31"
```

Response:
```json
{
  "totalTips": 125.50,
  "totalRevenueUSDC": 2500.75,
  "totalRefunds": 3,
  "totalMints": 45,
  "shipmentsDelivered": 12,
  "shipmentsPending": 2,
  "timeframe": "2025-01-01 to 2025-01-31"
}
```

#### GET /api/admin/metrics/daily
Get daily metrics for the last N days:
```bash
curl "http://localhost:3000/api/admin/metrics/daily?days=30"
```

Response:
```json
[
  {
    "date": "2025-01-15",
    "tipsCount": 3,
    "revenueUsd": 125.50,
    "refundsCount": 1,
    "mintsCount": 2,
    "shipmentsDelivered": 1,
    "shipmentsPending": 0
  }
]
```

#### POST /api/admin/metrics/seed (Development Only)
Generate demo data for testing:
```bash
curl -X POST "http://localhost:3000/api/admin/metrics/seed"
```

Response:
```json
{
  "success": true,
  "message": "Demo data generated successfully",
  "dataGenerated": {
    "transactions": 150,
    "refunds": 8,
    "shipments": 45,
    "mints": 30,
    "tips": 25
  }
}
```

### Admin Dashboard
Access the analytics dashboard at `/admin/analytics` (requires admin authentication):

#### Summary Cards
- **Total Revenue**: USDC equivalent of all transactions
- **Total Tips**: Combined ETH and USDC tips
- **Total Refunds**: Number of refund requests
- **NFTs Minted**: Total attendance NFTs
- **Shipments Delivered**: Successfully delivered shipments
- **Shipments Pending**: In transit or pending shipments

#### Charts
- **Daily Revenue Trend**: Area chart showing revenue over time
- **Daily Activity**: Bar chart showing tips, refunds, and mints by day

#### Controls
- **Date Range Selector**: Filter data by last 7, 30 days, or all time
- **Seed Demo Data**: Generate realistic test data (development only)
- **Export CSV**: Download visible chart data as CSV

### Data Sources
The analytics system reads from these JSON files in the `/data` directory:
- `transactions.json`: Transaction records
- `refunds.json`: Refund requests and status
- `shipments.json`: Shipment tracking data
- `mints.json`: NFT mint records
- `tips.json`: TipJar payment data

### Performance & Caching
- **In-Memory Cache**: 30-second TTL to avoid heavy recomputation
- **Cache Keys**: Based on date ranges and parameters
- **Automatic Invalidation**: Cache expires after 30 seconds
- **Error Recovery**: Graceful fallback when data files are missing

### Error Handling
- **Missing Files**: Returns zeros when JSON files don't exist
- **Malformed Data**: Handles JSON parsing errors gracefully
- **Invalid Dates**: Validates date parameters and returns appropriate errors
- **Network Errors**: Proper HTTP status codes and error messages

### Development & Testing

#### Seed Demo Data
In development mode, use the "Seed Demo Data" button or API endpoint to generate realistic test data:
- 30 days of transaction history
- Randomized but deterministic data (seed: 12345)
- Backs up existing files before overwriting
- Generates transactions, refunds, shipments, mints, and tips

#### Acceptance Tests
Run the test script to verify all functionality:
```bash
node scripts/check-analytics.js
```

Test coverage:
- Daily metrics endpoint
- Summary metrics endpoint
- Seed data generation (development only)
- CSV generation and format validation
- Error handling for invalid parameters

#### Sample Test Commands
```bash
# Test daily metrics
curl "http://localhost:3000/api/admin/metrics/daily?days=7"

# Test summary metrics
curl "http://localhost:3000/api/admin/metrics/summary?from=2025-01-01&to=2025-01-31"

# Seed demo data (development only)
curl -X POST "http://localhost:3000/api/admin/metrics/seed"
```

### Production Considerations
For production deployments, consider:
- **Database Backend**: Replace JSON files with a proper database
- **Analytics Pipeline**: Use services like Mixpanel, Amplitude, or custom analytics
- **Caching Strategy**: Implement Redis or similar for distributed caching
- **Data Retention**: Implement data archiving and cleanup policies
- **Monitoring**: Add metrics for endpoint performance and error rates

### Security
- **Admin Protection**: All endpoints require admin authentication
- **Development Only**: Seed endpoint is disabled in production
- **Input Validation**: Date parameters are validated and sanitized
- **Error Messages**: Avoid exposing sensitive information in error responses

## Audit Logs (Day 24)

### Overview
The audit logging system provides comprehensive tracking of all important events in the application. It records all payments, mints, refunds, uploads, admin actions, invite usage, and login/connect events to an append-only audit log.

### Features
- **Comprehensive Event Tracking**: Records payments, mints, refunds, uploads, admin actions, invites, and logins
- **Admin Dashboard**: View, filter, search, and export audit logs through `/admin/audit`
- **CSV Export**: Export filtered audit logs or full audit history as CSV
- **Real-time Monitoring**: Events are logged immediately when they occur
- **Secure Storage**: Uses atomic file writes to prevent data corruption
- **Privacy Protection**: Automatically sanitizes sensitive data like private keys

### Event Types
- `payment`: TipJar payment transactions
- `mint`: Regular NFT mints
- `special-mint`: Special NFT reward mints
- `refund_request`: Refund requests submitted by users
- `refund_processed`: Refunds approved and processed by admins
- `upload`: File uploads by admins
- `invite`: Invite creation by admins
- `invite_use`: Invite usage by users
- `admin`: Admin actions (status changes, revocations)
- `login`: Wallet connections/logins

### Storage
For development and demo purposes, audit logs are stored in a local JSON file at `/data/audit-logs.json`. This provides:
- **Simplicity**: No database required for development
- **Portability**: Easy to backup and inspect logs
- **Atomic Writes**: Uses temporary files and rename operations for data integrity

**Production Note**: For production deployments, especially on platforms like Vercel with ephemeral filesystems, consider migrating to a persistent database or external storage like S3 with encryption.

### Admin Interface
Access the audit dashboard at `/admin/audit` (requires admin authentication):
- **Table View**: Browse audit events with pagination
- **Filtering**: Filter by date range, event type, and search across all fields
- **Event Details**: Click any event to view full JSON details
- **CSV Export**: Export visible results or full audit history
- **Real-time Updates**: Refresh to see latest events

### API Endpoints

#### POST /api/audit
Create a new audit event:
```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "actor": "0x1234567890123456789012345678901234567890",
    "details": {"note": "Test event"},
    "metadata": "Test audit event"
  }'
```

#### GET /api/admin/audit
Retrieve audit events with filtering:
```bash
# Get recent audit events
curl "http://localhost:3000/api/admin/audit?limit=10"

# Filter by date range and type
curl "http://localhost:3000/api/admin/audit?from=2024-01-01&to=2024-12-31&type=payment"

# Search across all fields
curl "http://localhost:3000/api/admin/audit?q=refund"

# Export as CSV
curl "http://localhost:3000/api/admin/audit?format=csv" > audit-logs.csv
```

### Integration Examples
The audit system is automatically integrated throughout the application:

**TipJar Payments**:
```javascript
// Automatically logged after successful payment
{
  type: 'payment',
  actor: walletAddress,
  user: recipientAddress,
  details: {
    txHash: '0x...',
    amount: 1.5,
    currency: 'ETH',
    recipientId: 'env-club'
  }
}
```

**NFT Mints**:
```javascript
// Logged after successful mint
{
  type: 'mint',
  actor: minterAddress,
  user: recipientAddress,
  details: {
    txHash: '0x...',
    tokenId: '1',
    event: 'week1'
  }
}
```

**Admin Actions**:
```javascript
// Logged when admin changes transaction status
{
  type: 'admin',
  actor: adminWallet,
  user: customerWallet,
  details: {
    action: 'status_change',
    transactionId: 'tx123',
    newStatus: 'shipped'
  }
}
```

### Development Setup
1. **Automatic Creation**: The audit system automatically creates the `/data` directory and `audit-logs.json` file
2. **No Configuration**: Works out of the box with no additional setup
3. **Sample Data**: Use the sample cURL commands above to create test audit events

### Monitoring & Maintenance
- **File Size**: Monitor the audit log file size in production
- **Rotation**: Consider implementing log rotation for long-running applications
- **Backup**: Regularly backup audit logs for compliance and disaster recovery
- **Encryption**: Add encryption for sensitive production environments

### Testing Mainnet Safely

#### Setup
1. **Fund Test Wallet**: Add small amount of ETH/USDC to a test wallet on Base Mainnet
2. **Set Environment**: Configure both RPC URLs in `.env.local`
3. **Start with Sepolia**: Always test on Sepolia first, then switch to mainnet

#### Testing Steps
1. **Network Toggle**:
   - Load app (defaults to Sepolia)
   - Toggle to mainnet → confirmation modal appears
   - Type "CONFIRM MAINNET" → network switches
   - Verify chain badge shows "Base Mainnet"

2. **Balance Checks**:
   - Connect wallet with low ETH balance (< 0.001 ETH)
   - Try to send tip → should show low balance warning
   - Add sufficient ETH → warning disappears

3. **Mainnet Transaction**:
   - Ensure adequate balance and confirmation
   - Send small test tip (e.g., 0.001 ETH)
   - Verify transaction appears on mainnet Basescan
   - Check that confirmation persists for 24 hours

4. **Server Verification**:
   - Test `/api/verify-payment` with mainnet transaction hash
   - Verify correct RPC is used for verification
   - Check that mainnet transactions are properly validated

#### Safety Checklist
- [ ] Network toggle works without reload
- [ ] Mainnet confirmation modal requires exact text
- [ ] Low balance warnings block transactions
- [ ] Balance checks work for both ETH and USDC
- [ ] Server-side verification supports both networks
- [ ] Confirmation expires after 24 hours
- [ ] Visual indicators clearly show mainnet vs testnet

### Vercel Deployment

#### Environment Variables
Add these to your Vercel project settings:
```env
NEXT_PUBLIC_RPC_URL_SEPOLIA=https://sepolia.base.org
NEXT_PUBLIC_RPC_URL_MAINNET=https://mainnet.base.org
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
```

#### RPC Provider Setup
- **Sepolia**: Use public Base Sepolia RPC or Alchemy/Infura endpoint
- **Mainnet**: **Important**: Set up a reliable mainnet RPC provider
  - Recommended: Alchemy, Infura, or Base's official mainnet RPC
  - Avoid using public RPCs for production mainnet operations
  - Consider rate limits and reliability for your use case

### File Structure
```
lib/
  networks.ts                    # Network configuration and helpers

components/
  network-toggle.tsx             # Network toggle with confirmation
  mainnet-confirm-modal.tsx      # CONFIRM MAINNET modal

app/api/verify-payment/
  route.ts                       # Updated to support both networks
```

### Production Considerations
- **RPC Reliability**: Use enterprise-grade RPC providers for mainnet
- **Rate Limits**: Monitor API usage and implement proper rate limiting
- **Error Handling**: Robust error handling for network switching failures
- **Monitoring**: Track mainnet transaction success rates and errors
- **Security**: Regular security audits for mainnet transaction flows

---

### Shipments Log
- **Page:** `/shipments`
- Displays a table of shipments with:
  - Wallet address
  - Token ID (any numeric value)
  - Shipment date/time
  - Transaction hash (clickable Basescan link)
- Data is loaded from `/data/shipments.json`.
- Manual entry form for new shipments (wallet, token ID, date/time, tx hash).
- Table is searchable by wallet or token ID.
- Export shipments as CSV.
- All changes persist in `/data/shipments.json`.

### Attendance QR Minting
- **Page:** `/attendance`
- Shows a QR code linking to `/api/mint?event=week1` (scan to mint attendance NFT).
- Displays remaining supply counter (X of 50 mints left).
- Mint button requires wallet connection (OnchainKit + wagmi).
- Calls ERC-1155 smart contract mint function.
- Uses `/public/attendance.json` for NFT metadata.
- Updates `/data/mints.json` with wallet, event, time, and tx hash.
- Enforces a maximum of 50 mints for the event.
- Shows success message with transaction hash, Basescan link, and copy hash button.
- All changes persist in `/data/mints.json`.

### Admin Attendance View
- **Page:** `/admin/attendance`
- Displays all mints per event from `/data/mints.json`.
- Searchable by wallet or event.
- Export all mints as CSV.

---

## Mint Limit
- Each attendance event (e.g., `week1`) is limited to 50 mints.
- Once the limit is reached, minting is disabled and the UI displays a message.

---

## Testing Steps

### Shipments Log
1. Go to `/shipments`.
2. Add a new shipment using the manual entry form.
3. Search for shipments by wallet or token ID.
4. Export the table as CSV and verify the file.
5. Confirm that new shipments persist after reload.

### Attendance QR Minting
1. Go to `/attendance`.
2. Scan the QR code or connect your wallet and click Mint.
3. If under 50 mints, mint should succeed and show a success message with tx hash and Basescan link.
4. Try minting after 50 mints to confirm the limit is enforced.
5. Confirm that new mints persist after reload.

### Admin Attendance View
1. Go to `/admin/attendance`.
2. Search for mints by wallet or event.
3. Export the table as CSV and verify the file.
4. Confirm that all mints are displayed and persist after reload.

---

## Data Persistence
- All logs and mints are stored in `/data/shipments.json` and `/data/mints.json` at the project root.
- These files are updated on every new entry and persist across sessions.

---

## Demo (Local)
Run the app and try:
1) Connect a wallet (MetaMask / Coinbase / WalletConnect)
2) Reload — it auto-reconnects
3) Select a recipient (Env Club, AI Club, or Dev Club) from the dropdown
4) Send a tip and see the Basescan link with copyable transaction hash
5) View live totals by recipient and transaction history
6) Check the Daily Features section to ship a feature and process a tx

---

## Tech Stack
- Next.js 14 (App Router)
- React 18
- Wagmi + Viem
- WalletConnect v2, MetaMask, Coinbase Wallet
- OnchainKit UI components
- Tailwind CSS

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- WalletConnect Project ID (free at [cloud.walletconnect.com](https://cloud.walletconnect.com))

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd base-daily

# Install dependencies
pnpm install

# Copy environment template
cp env.example .env.local
```

### Environment Configuration
Edit `.env.local` with your values:
```env
# Network Configuration
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
CONFIRM_MAINNET=false

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# RPC URLs
NEXT_PUBLIC_RPC_URL_SEPOLIA=https://sepolia.base.org
NEXT_PUBLIC_RPC_URL_MAINNET=https://mainnet.base.org

# USDC Token Address (Base Sepolia)
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Paywall Configuration
NEXT_PUBLIC_PAYWALL_RECIPIENT=0x1234567890123456789012345678901234567890

# Admin Configuration
NEXT_PUBLIC_ADMIN_WALLETS=["0x1234567890123456789012345678901234567890"]
```

### Development
```bash
# Start development server
pnpm dev

# Run smoke tests
pnpm run smoke

# Build for production
pnpm build
```

Open `http://localhost:3000` to view the application.

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables from `.env.local` in Vercel dashboard
4. Deploy

### Seed Demo Data
```bash
# Start the development server
pnpm dev

# In another terminal, seed demo data
curl -X POST http://localhost:3000/api/admin/metrics/seed
```

### Run Smoke Tests
```bash
# Test against local development server
pnpm run smoke

# Test against deployed URL
pnpm run smoke -- --url https://your-app.vercel.app
```

---

## Key Features

### Wallet Persistence
- File: `lib/wagmi.ts`
  - `autoConnect: true` enables automatic reconnection.
  - WalletConnect configured with metadata for session persistence.
- Files: `hooks/use-wallet-persistence.ts`, `lib/wallet-persistence.ts`
  - Saves `{ address, connectorId, chainId, connectedAt }` in localStorage.
  - Attempts silent reconnect on load; clears stale/invalid sessions.

### Tip Jar (ETH + USDC) with Recipient Selection
- File: `components/tip-jar.tsx`
  - Recipient dropdown: Choose from Env Club, AI Club, or Dev Club
  - ETH: `useSendTransaction` with `parseEther(amount)` to selected recipient's ETH address.
  - USDC: ERC-20 `transfer(recipient, amount)` with `parseUnits(amount, 6)` to selected recipient's USDC address.
  - Currency selector, presets (0.5, 1, 2), manual input, recipient dropdown.
  - Success panel with tx hash, copy, and Basescan link. 
  - Live totals tracking by recipient with real-time updates.
  - Latest 3 shipments shown inline with link to `/shipments`.
- File: `config/recipients.ts` - Configure recipient addresses for each club
- File: `lib/tips-tracking.ts` - Track totals and transaction history

### Shipments
- Page: `/shipments` displays:
  - Total tips by recipient (ETH and USDC)
  - Recent tip transactions with recipient names, amounts, and Basescan links
  - Legacy transactions from previous versions
  - Copy transaction hash functionality

### Daily Features & Daily Transaction
- Files: `lib/daily-features.ts`, `hooks/use-daily-features.ts`, `components/daily-features.tsx`
  - On successful wallet connection, the app:
    - Ships 1 feature (tracked in localStorage)
    - Processes 1 transaction (demo flow; configurable)
  - UI shows today’s status and historical totals.

---

## Project Structure
```
app/
  layout.tsx          # App shell
  page.tsx            # Main page (Daily Features, Tip Jar, etc.)
  providers.tsx       # Wagmi, QueryClient, OnchainKit providers

components/
  header.tsx          # Wallet UI, disconnect handler
  tip-jar.tsx         # Send ETH tips
  daily-features.tsx  # Daily automation UI

hooks/
  use-wallet-persistence.ts  # Auto-reconnect logic
  use-daily-features.ts      # Daily feature + tx orchestration

lib/
  wagmi.ts             # Wagmi config (autoConnect, connectors)
  wallet-persistence.ts# localStorage utils
  daily-features.ts    # Daily logic and helpers
```

---

## Customization

### Change recipient addresses
- Edit `/config/recipients.ts` to update ETH and USDC addresses for each club
- Replace placeholder addresses with actual club wallet addresses

### Change chain or RPC
- Update `lib/wagmi.ts` chains and `NEXT_PUBLIC_RPC_URL`.

### Add/modify daily features
- Edit `AVAILABLE_FEATURES` in `lib/daily-features.ts`.

### Adjust persistence behavior
- Edit `isWalletConnectionValid` (expiry window, validation) in `lib/wallet-persistence.ts`.

---

## Troubleshooting
- Tip Jar button disabled
  - Ensure wallet is connected and a recipient is selected from the dropdown.
  - Check that recipient addresses are configured in `/config/recipients.ts`.
- Wallet won't auto-reconnect
  - Check browser console; verify localStorage is enabled and not cleared.
  - Confirm `autoConnect: true` in `lib/wagmi.ts` and no errors from connectors.
- "Invalid request: params[0].to is a required field"
  - Ensure recipient addresses are properly configured in `/config/recipients.ts`.
- Totals not updating
  - Check browser console for localStorage errors.
  - Verify the tips tracking system is working by checking `/data/tips.json`.

---

## Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_RPC_URL`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
   - `NEXT_PUBLIC_USDC_ADDRESS` (if using USDC tips)
4. Deploy

Or use the Vercel CLI:
```bash
npx vercel
```

### Environment Variables for Production
- Update recipient addresses in `/config/recipients.ts` with production addresses
- Ensure all environment variables are set in your deployment platform

---

## How to Test TipJar

1. Connect MetaMask (or Base Wallet via WalletConnect).
2. Ensure wallet is on Base Sepolia (RPC provided in `.env.local`).
3. Select a recipient from the dropdown (Env Club, AI Club, or Dev Club).
4. Choose currency (ETH or USDC) and use presets (0.5, 1, 2) or enter a custom amount.
5. Send tip. After success, copy the transaction hash and click the Basescan link to view the tx.
6. Verify totals update in real-time for the selected recipient.
7. Visit `/shipments` to see all transactions with recipient names and totals.

What I shipped: After tip, capture tx hash, copy it, and verify it appears in the success panel and totals display.

### Health Check
- Endpoint: `/health` returns `OK`.
- Script: `pnpm run health:curl` prints the curl command; then run it while dev server is running.

### 30s voiceover script
"This is Base Daily. Connect your wallet, select a recipient from the dropdown, pick ETH or USDC, tap a preset like one ETH or enter your own amount, and send a tip on Base Sepolia. After it confirms, copy the transaction hash or jump straight to Basescan. View live totals by recipient and see your transaction history. Clone the repo, set `.env.local`, and run `pnpm dev` to try it."

### 60s voiceover script
"Welcome to Base Daily, a minimal Next.js starter for shipping onchain interactions fast. It's wired up with Wagmi, Viem, and OnchainKit. The Tip Jar now supports ETH and USDC on Base Sepolia with recipient selection. Choose from Env Club, AI Club, or Dev Club, pick a currency, tap a preset—0.5, 1, or 2—or type a custom amount. ETH uses a native transfer; USDC calls ERC‑20 transfer with 6‑decimals. After success, we show the transaction hash with a copy button and a Basescan link. Every tip is tracked by recipient with live totals and transaction history. Setup is simple: set the RPC URL, recipient addresses in config, and optional USDC address in `.env.local`, then `pnpm dev`. There's also a `/health` endpoint for sanity checks. Fork it, deploy to Vercel, and start shipping."

---

## Admin Dashboard (Day 7)

### Overview
A comprehensive admin dashboard for event analytics and transaction management. The dashboard aggregates mints/purchases per event, shows unique wallets, totals, and allows CSV export. Features secure admin-only access, time period filtering, and real-time analytics.

### Pages
- **`/admin/dashboard`** - Main admin dashboard with event analytics and transaction management

### API Endpoints
- **`GET /api/admin/events`** - Fetch all available events
- **`GET /api/admin/event-stats?event=week1&period=7d`** - Get event statistics and transactions
- **`POST /api/admin/export-csv`** - Export event data as CSV file

### Features
- **Event Analytics**: View totals for mints, purchases, and unique wallets per event
- **Time Filtering**: Filter data by last 24h, 7d, 30d, or all time
- **Transaction Management**: Paginated table showing all transactions with wallet addresses, tx hashes, types, tokens, amounts, and timestamps
- **CSV Export**: Download transaction data as CSV files with automatic filename generation
- **Admin Security**: Demo admin gate using `NEXT_PUBLIC_ADMIN_KEY` environment variable
- **Real-time Updates**: Live data from JSON files with loading states and error handling

### Data Sources
- **`/data/mints.json`** - Mint records (wallet, event, time, txHash)
- **`/data/purchases.json`** - Purchase records (token, fileId, txHash, buyer, timestamp, expiry)
- **`/data/shipments.json`** - Shipment records (wallet, tokenId, date, txHash)

### Admin Access
The dashboard uses a simple demo admin gate for security:

1. **Environment Variable**: Set `NEXT_PUBLIC_ADMIN_KEY` in your environment
2. **Access Methods**:
   - URL parameter: `/admin/dashboard?adminKey=YOUR_KEY`
   - Local storage: Key is automatically saved after first successful access
3. **Authorization**: Dashboard only shows data if the provided key matches the environment variable

### Environment Variables
```env
# Admin dashboard access key (required for demo mode)
NEXT_PUBLIC_ADMIN_KEY=your-secure-admin-key-here
```

### Testing the Admin Dashboard

#### Setup
1. Set `NEXT_PUBLIC_ADMIN_KEY` in your `.env.local` file
2. Add sample data to `/data/mints.json` and `/data/purchases.json` (already included)
3. Run `pnpm dev` and navigate to `/admin/dashboard?adminKey=YOUR_KEY`

#### Verification Steps
1. **Access Control**: 
   - Visit `/admin/dashboard` without key → should show "Not authorized"
   - Visit `/admin/dashboard?adminKey=YOUR_KEY` → should show dashboard
   - Refresh page → should remain authorized (localStorage)

2. **Event Analytics**:
   - Select different events from dropdown
   - Verify KPIs match manual counts from JSON files
   - Test time period filters (24h, 7d, 30d, all)

3. **Transaction Table**:
   - Verify transactions list includes sample data
   - Test pagination (50 rows per page)
   - Check transaction details (wallet, txHash, type, token, amount, timestamp)

4. **CSV Export**:
   - Click "Export CSV" button
   - Verify file downloads with correct filename format: `event-week1-2025-01-08.csv`
   - Open CSV in spreadsheet app and verify data integrity

5. **Data Persistence**:
   - Add new entries to JSON files
   - Refresh dashboard and verify new data appears
   - Test that changes persist across sessions

### API Response Format

#### Event Stats API (`/api/admin/event-stats`)
```json
{
  "event": "week1",
  "totalMints": 3,
  "totalPurchases": 2,
  "uniqueWallets": 4,
  "transactions": [
    {
      "wallet": "0x1234...",
      "txHash": "0xabcd...",
      "type": "mint",
      "token": "ETH",
      "amount": 1,
      "timestamp": "2025-01-08T10:00:00Z"
    }
  ]
}
```

#### CSV Export Format
```csv
"Wallet","Transaction Hash","Type","Token","Amount","Timestamp"
"0x1234...","0xabcd...","mint","ETH","1","2025-01-08T10:00:00Z"
```

### Production Considerations
- **Security**: Replace demo admin gate with proper authentication system
- **Data Storage**: Consider database migration for large datasets
- **Performance**: Implement caching for frequently accessed data
- **Monitoring**: Add logging and error tracking for production use

### File Structure
```
app/
  admin/
    dashboard/page.tsx          # Admin dashboard UI
  api/
    admin/
      events/route.ts          # Fetch events endpoint
      event-stats/route.ts     # Event statistics endpoint
      export-csv/route.ts      # CSV export endpoint

lib/
  admin.ts                     # Admin utilities and helpers
  mints.ts                     # Mint data management
  purchases.ts                 # Purchase data management

data/
  mints.json                   # Mint records
  purchases.json              # Purchase records
  shipments.json              # Shipment records
```

### Acceptance Checklist
- [ ] `/admin/dashboard` accessible with correct admin key and blocked otherwise
- [ ] Dashboard shows correct aggregates for sample events
- [ ] CSV export downloads valid CSV file with expected columns
- [ ] API `/admin/event-stats` returns correct JSON structure
- [ ] `pnpm dev` runs without errors
- [ ] Time period filters change totals correctly
- [ ] Pagination works for large transaction lists
- [ ] Admin key persists in localStorage after first access

---

## Invite Links (Day 8)

### Overview
A comprehensive invite link system that allows admins to generate one-time-use invite links. These links prefill the TipJar with recipient and amount information, expire after first successful use (or optionally after a set expiry time), and provide full lifecycle management through an admin interface.

### Pages
- **`/invite/create`** - Admin page for creating invite links with QR code generation
- **`/invite/[token]`** - Client page that handles invite redemption and TipJar prefill
- **`/admin/invites`** - Admin interface for managing all invite links

### API Endpoints
- **`POST /api/invite/create`** - Create new invite link with recipient, currency, amount, and optional expiry
- **`GET /api/invite/[token]`** - Fetch invite details and validate status
- **`POST /api/invite/use`** - Mark invite as used after successful tip transaction
- **`POST /api/invite/revoke`** - Revoke unused invite links
- **`GET /api/admin/invites`** - Fetch all invites for admin management
- **`POST /api/admin/invites`** - Export invites as CSV

### Features
- **One-time Use**: Invites automatically expire after first successful use
- **Optional Expiry**: Set custom expiry times (1 hour, 1 day, 1 week, 1 month)
- **TipJar Prefill**: Automatically fills recipient, currency, and amount in TipJar
- **QR Code Generation**: Visual QR codes for easy sharing
- **Admin Management**: Full lifecycle management with status tracking
- **CSV Export**: Export all invite data for analysis
- **Security**: Admin-only access with `NEXT_PUBLIC_ADMIN_KEY` authentication

### How Invite Links Work

#### Creating Invites
1. Admin visits `/invite/create` with admin key
2. Selects recipient (Env/AI/Dev Club), currency (ETH/USDC), and amount
3. Optionally sets expiry time
4. Clicks "Generate Invite" to create unique token and URL
5. Receives shareable URL and QR code

#### Using Invites
1. User clicks invite link (`/invite/[token]`)
2. System validates invite (unused, not expired)
3. If valid, stores prefill data in localStorage and redirects to TipJar
4. TipJar shows "Using invite — one-time link" badge
5. User sends tip with prefilled values
6. After successful transaction, invite is automatically marked as used

#### Admin Management
1. Admin visits `/admin/invites` to view all invites
2. See status (unused/used/expired), usage details, and timestamps
3. Copy invite links or test them directly
4. Revoke unused invites manually
5. Export all invite data as CSV

### Data Storage
- **`/data/invites.json`** - Stores all invite records with full lifecycle tracking
- **Invite Object Structure**:
  ```json
  {
    "id": "uuid",
    "token": "shortString",
    "recipientId": "env-club",
    "currency": "ETH",
    "amount": "0.5",
    "createdAt": "2025-01-08T10:00:00Z",
    "expiryAt": "2025-01-09T10:00:00Z",
    "used": false,
    "usedBy": null,
    "usedAt": null,
    "txHash": null
  }
  ```

### Environment Variables
```env
# Admin access key (required for invite management)
NEXT_PUBLIC_ADMIN_KEY=your-secure-admin-key-here

# Base URL for invite links (optional, defaults to localhost:3000)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Testing Steps

#### Create Invite
1. Set `NEXT_PUBLIC_ADMIN_KEY` in `.env.local`
2. Visit `/invite/create?adminKey=YOUR_KEY`
3. Create invite for Env Club @ 0.5 ETH
4. Copy the generated URL and QR code

#### Test Invite Flow
1. Open invite URL in incognito window
2. Verify TipJar is prefilled with correct recipient and amount
3. Send test tip on Base Sepolia
4. Confirm invite is marked as used after transaction

#### Admin Management
1. Visit `/admin/invites?adminKey=YOUR_KEY`
2. Verify invite shows as "used" with transaction details
3. Test revoke functionality on unused invites
4. Export CSV and verify data integrity

### Security Considerations
- **Token Generation**: Uses UUID v4 for secure, unpredictable tokens
- **Replay Prevention**: Server validates invite status before marking as used
- **Race Conditions**: Atomic file writes prevent concurrent usage issues
- **Admin Access**: All admin functions require `NEXT_PUBLIC_ADMIN_KEY`
- **Data Persistence**: Invites stored in JSON files (ephemeral on Vercel; use database for production)

### Production Notes
- **Database Migration**: Replace JSON file storage with proper database for production
- **Authentication**: Implement proper admin authentication system
- **Monitoring**: Add logging for invite creation, usage, and errors
- **Rate Limiting**: Consider rate limiting for invite creation and usage

### File Structure
```
app/
  invite/
    create/page.tsx              # Invite creation interface
    [token]/page.tsx            # Invite redemption page
  admin/
    invites/page.tsx            # Admin invite management
  api/
    invite/
      create/route.ts           # Create invite endpoint
      [token]/route.ts         # Fetch invite endpoint
      use/route.ts             # Mark invite as used
      revoke/route.ts          # Revoke invite endpoint
    admin/
      invites/route.ts         # Admin invite management

lib/
  invites.ts                   # Invite data management utilities

data/
  invites.json                 # Invite records storage
```

---

## Day 6 — Creator Checkout

### Overview
A complete creator checkout system for digital assets. Users can purchase digital assets with USDC on Base Sepolia and receive shareable receipts with Basescan links. Features server-side payment verification, receipt generation, and purchase tracking.

### Pages
- **`/checkout`** - Digital asset marketplace with buy buttons
- **`/receipt/[id]`** - Individual receipt display with sharing functionality

### API Endpoints
- **`POST /api/record-receipt`** - Server-side transaction verification and receipt generation
- **`GET /api/my-receipts?wallet=0x...`** - Fetch user's purchase receipts
- **`GET /api/receipt/[id]`** - Fetch individual receipt details

### Payment Flow
1. User visits `/checkout` page and connects wallet
2. User clicks "Buy Now" on any digital asset
3. Wallet prompts for USDC transfer to asset recipient
4. Transaction is sent and confirmed on Base Sepolia
5. Client calls `/api/record-receipt` with tx hash, asset ID, and buyer address
6. Server verifies payment using viem/wagmi against blockchain
7. If valid, generates receipt and stores in `/data/receipts.json`
8. User is redirected to `/receipt/[id]` with shareable receipt

### Data Storage
- **`/data/receipts.json`** - Receipt records (id, txHash, assetId, buyer, amount, currency, timestamp)
- **`/lib/assets.ts`** - Digital asset definitions and metadata

### Features
- Server-side payment verification using blockchain data
- Shareable receipts with Basescan links
- Purchase tracking prevents duplicate payments
- Ownership checking for already purchased assets
- Social sharing with prefilled text

### Testing the Creator Checkout Feature

#### User Purchase
1. Go to `/checkout` page
2. Connect wallet (MetaMask/Coinbase Wallet)
3. Click "Buy Now" on any available digital asset
4. Approve USDC transfer in wallet
5. Wait for transaction confirmation
6. Receipt page opens automatically with Basescan link
7. Click "Share Receipt" to share on social media

#### Getting USDC on Base Sepolia
- **Base Sepolia Faucet**: https://bridge.base.org/deposit
- **Alchemy Faucet**: https://sepoliafaucet.com/
- **Chainlink Faucet**: https://faucets.chain.link/base-sepolia

### Environment Variables
```env
# Base Sepolia RPC URL
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# USDC Token Address on Base Sepolia
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Paywall recipient address (where payments go)
NEXT_PUBLIC_PAYWALL_RECIPIENT=0xYOUR_RECIPIENT_ADDRESS
```

---

## Pay-per-File Feature (Dual Mode)

### Overview
A complete pay-per-file system supporting both **Onchain Mode** (USDC/ETH payments) and **Demo/Offline Mode** (instant unlock without wallet). Features server-side payment verification, secure token-based downloads, and purchase tracking.

### Dual Mode Support
- **Onchain Mode**: Users with connected wallets pay in USDC or ETH to unlock files
- **Demo/Offline Mode**: No wallet connection needed; instant unlock with temporary tokens
- **Flexible UX**: Users can choose between onchain payments or demo mode

### Pages
- **`/files`** - Public file marketplace with buy/download functionality
- **`/admin/files`** - Admin interface for uploading files and setting prices

### API Endpoints
- **`POST /api/upload`** - Admin file upload (multipart/form-data)
- **`POST /api/verify-payment`** - Server-side transaction verification
- **`POST /api/purchase`** - Complete purchase flow and token generation
- **`GET /api/download?token=xxx`** - Secure file download with token validation
- **`GET /api/files`** - Fetch all available files
- **`GET /api/purchases?buyer=0x...`** - Fetch user's purchase history

### Payment Flow

#### Onchain Mode (Wallet Connected)
1. User clicks "Buy with USDC" on `/files` page
2. Wallet prompts for USDC transfer to file recipient
3. Transaction is sent and confirmed on Base Sepolia
4. Client calls `/api/purchase` with tx hash, file ID, and buyer address
5. Server verifies payment using viem/wagmi against blockchain
6. If valid, generates 24-hour download token and stores purchase record
7. User receives download link with token

#### Demo/Offline Mode (No Wallet)
1. User clicks "Unlock Instantly (Demo)" on `/files` page
2. Client calls `/api/purchase` with `{ fileId, demoMode: true }`
3. Server skips payment verification and generates token immediately
4. User receives download link with token (24-hour expiry)

### Data Storage
- **`/data/files.json`** - File metadata (id, title, description, price, recipient)
- **`/data/purchases.json`** - Purchase records (token, fileId, txHash, buyer, expiry)
- **`/public/files/`** - Uploaded PDF files (ephemeral on Vercel)

### Security Features
- Server-side payment verification using blockchain data
- Token-based downloads with 24-hour expiry
- Purchase tracking prevents duplicate payments
- File access validation on every download request

### Environment Variables
```env
# Base Sepolia RPC URL
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# USDC Token Address on Base Sepolia
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Paywall recipient address (where payments go)
NEXT_PUBLIC_PAYWALL_RECIPIENT=0xYOUR_RECIPIENT_ADDRESS

# Default price in USDC (can be overridden per file)
NEXT_PUBLIC_PAYWALL_PRICE_USDC=1

# Base URL for server-side API calls
NEXT_PUBLIC_BASE_URL=https://your-deployment-url.example
```

### Testing the Pay-per-File Feature

#### Admin Upload
1. Go to `/admin/files`
2. Enter admin key: `base-daily-admin-2024`
3. Upload a PDF file
4. Set title, description, price (USDC), and recipient address
5. Click "Upload File"
6. Verify file appears on `/files` page

#### Onchain Mode Testing
1. Go to `/files` page
2. Connect wallet (MetaMask/Coinbase Wallet)
3. Click "Buy with USDC" on any available file
4. Approve USDC transfer in wallet
5. Wait for transaction confirmation
6. Download link appears automatically
7. Click "Download File" to get the PDF

#### Demo Mode Testing
1. Go to `/files` page (no wallet connection needed)
2. Click "Unlock Instantly (Demo)" on any available file
3. File unlocks immediately without payment
4. Click "Download File" to get the PDF
5. Token expires after 24 hours

#### Getting USDC on Base Sepolia
- **Base Sepolia Faucet**: https://bridge.base.org/deposit
- **Alchemy Faucet**: https://sepoliafaucet.com/
- **Chainlink Faucet**: https://faucets.chain.link/base-sepolia

### Production Considerations
- **File Storage**: Vercel doesn't persist `/public` uploads between deployments
- **Recommended**: Use AWS S3, Cloudinary, or similar for production file storage
- **Database**: Consider PostgreSQL/MongoDB for production metadata storage
- **Security**: Implement rate limiting and additional validation for production

### File Structure
```
app/
  files/page.tsx              # Public file marketplace
  admin/files/page.tsx         # Admin upload interface
  api/
    upload/route.ts           # File upload endpoint
    verify-payment/route.ts   # Payment verification
    purchase/route.ts        # Purchase completion
    download/route.ts         # Token-based download
    files/route.ts           # Fetch files
    purchases/route.ts       # Fetch purchases

lib/
  files.ts                    # File metadata management
  purchases.ts               # Purchase tracking

data/
  files.json                 # File metadata storage
  purchases.json            # Purchase records
```

---

## Mini-app Shell (Day 9)

### Overview
A compact "mini-app shell" route optimized for being opened inside the Base mobile app's in-app browser. The shell presents the TipJar as a single, focused screen with large touch targets, no extraneous navigation, and graceful wallet connect behavior for in-app wallets and WalletConnect.

### Route
- **`/mini-app`** - Compact TipJar interface optimized for mobile in-app browsers

### Features
- **Mobile-First Design**: Large touch targets (56px+), optimized for mobile viewports
- **In-App Browser Detection**: Automatically detects Base app environment and adapts UX
- **Compact Interface**: Minimal header with app logo, focused TipJar functionality
- **Large Buttons**: Full-width connect wallet, preset amounts, and send tip buttons
- **Inline Receipts**: View recent tips in-page modal instead of navigation
- **No External Popups**: All actions stay within the same page or use modals
- **WalletConnect Fallback**: Graceful handling when in-app wallet isn't available
- **Prefill Support**: Reads invite prefill from localStorage for seamless invite flows

### Mobile Optimizations
- **Safe Area Support**: Uses `env(safe-area-inset-*)` utilities for proper mobile spacing
- **Viewport Meta**: Optimized viewport settings for in-app browsers
- **Theme Color**: Base blue theme color for native app integration
- **Touch Targets**: All interactive elements meet accessibility guidelines (48-56px minimum)
- **No Hover States**: Avoids tooltips/popovers that require hover interaction

### Testing in Base Mobile App
1. **Deploy to Vercel**: Push your code and deploy to get a public URL
2. **Open in Base App**: 
   - Copy the Vercel URL (e.g., `https://your-app.vercel.app/mini-app`)
   - Open Base mobile app
   - Navigate to the browser/webview section
   - Paste the URL and navigate to `/mini-app`
3. **Test Wallet Connection**: 
   - Tap "Connect Wallet" - should use Base app's in-app wallet
   - If external wallet needed, WalletConnect flow will open
4. **Test Tip Flow**:
   - Select recipient, amount, and send tip
   - Verify success panel shows tx hash and Basescan link
   - Test "View Receipts" modal functionality

### Design Notes
- **In-App Limitations**: Avoid `window.open()` and external navigation
- **WalletConnect**: Shows QR code for external wallets when in-app wallet unavailable
- **Responsive**: Adapts to different mobile screen sizes and orientations
- **Performance**: Minimal bundle size, no heavy animations or large images

### File Structure
```
app/
  mini-app/
    page.tsx              # Main mini-app route
    layout.tsx            # Mobile-optimized metadata
    manifest.json         # PWA manifest for installability

components/
  mini-tipjar.tsx        # Compact TipJar component
```

### Manifest Configuration
The mini-app includes a `manifest.json` with recommended Base mini-app fields:
```json
{
  "name": "Base Daily Mini Tip Jar",
  "short_name": "Base Daily", 
  "start_url": "/mini-app",
  "display": "standalone",
  "theme_color": "#0052FF"
}
```

### Environment Detection
The mini-app automatically detects in-app browser environments:
- **Base App**: Checks `navigator.userAgent` for "Base" string
- **Standalone**: Detects `display-mode: standalone` for PWA-like behavior
- **Adaptive UX**: Disables external links and optimizes for in-app experience

---

## Production Uploads (S3) - Day 12

### Overview
Production-ready file storage system using AWS S3 with signed URLs for secure downloads. Files are uploaded to S3 (or S3-compatible storage) and accessed via time-limited signed URLs after payment verification. Includes fallback to local storage for development.

### Features
- **S3 Integration**: Upload files directly to AWS S3 with private ACL
- **Signed URLs**: Generate time-limited download URLs (1-24 hours) after payment
- **Fallback Mode**: Automatic fallback to local storage when S3 is not configured
- **Security**: Files are private by default, only accessible via presigned URLs
- **Demo Compatibility**: Demo mode works with or without S3 configuration

### S3 Setup

#### 1. Create S3 Bucket
1. Go to AWS S3 Console
2. Create a new bucket (e.g., `base-daily-files`)
3. Configure bucket settings:
   - **Region**: Choose your preferred region (e.g., `us-east-1`)
   - **Block Public Access**: Keep enabled (files are private)
   - **Versioning**: Optional, enable if needed
   - **Encryption**: Enable server-side encryption

#### 2. Create IAM User
1. Go to AWS IAM Console
2. Create new user: `base-daily-s3-user`
3. Attach policy with minimal permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

4. Generate access keys for the user
5. **Important**: Store keys securely, never commit to version control

#### 3. Environment Variables
Add to your `.env.local`:

```env
# S3 Storage Configuration (Production)
S3_BUCKET_NAME=your-s3-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-s3-access-key-id
S3_SECRET_ACCESS_KEY=your-s3-secret-access-key
S3_UPLOAD_PREFIX=uploads
SIGNED_URL_EXPIRY_SECONDS=3600

# Optional: S3 Endpoint for S3-compatible services
# S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

#### 4. Vercel Deployment
Add environment variables in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all S3 variables listed above
3. Deploy your application

### File Upload Flow

#### Admin Upload (`/admin/files`)
1. Admin uploads PDF file via form
2. Server validates file (PDF only, max 10MB)
3. **If S3 configured**: Upload to S3 with deterministic path
   - Path format: `uploads/YYYY-MM-DD/uuid-filename.pdf`
4. **If S3 not configured**: Save to local `/public/files/`
5. Store metadata in `/data/files.json` with `s3Key` field

#### Purchase Flow (`/files`)
1. User purchases file (onchain or demo mode)
2. Server verifies payment (if onchain)
3. **If S3 file**: Generate signed download URL
4. **If local file**: Return token-based download URL
5. Client receives download URL with expiry information

### Security Features

#### S3 Security
- **Private ACL**: All uploaded files are private by default
- **Signed URLs**: Only accessible via time-limited presigned URLs
- **IAM Permissions**: Minimal permissions (upload/get only)
- **No Public Access**: Files cannot be accessed without valid signed URL

#### Token Security
- **24-hour Expiry**: Download tokens expire after 24 hours
- **One-time Use**: Tokens are validated on each download request
- **Purchase Tracking**: All downloads are logged with purchase records

### Testing S3 Integration

#### Local Testing
1. Set S3 environment variables in `.env.local`
2. Run `pnpm dev`
3. Upload file via `/admin/files`
4. Check S3 console to verify file was uploaded
5. Purchase file and verify signed URL works

#### Production Testing
1. Deploy to Vercel with S3 environment variables
2. Upload file via admin interface
3. Purchase file and verify download works
4. Test signed URL expiry (wait 1+ hours)

### Fallback Behavior

#### Development Mode (No S3)
- Files stored in `/public/files/` directory
- Access via token-based download endpoint
- **Note**: Files are ephemeral on Vercel deployments

#### S3 Failure Fallback
- If S3 upload fails, automatically falls back to local storage
- Error logged but upload continues
- Purchase flow adapts to storage method

### Monitoring & Maintenance

#### Signed URL Expiry
- Default: 1 hour (3600 seconds)
- Configurable via `SIGNED_URL_EXPIRY_SECONDS`
- URLs automatically expire and become invalid

#### Revocation
- Mark purchase as invalid in `/data/purchases.json`
- Rotate S3 access keys to invalidate all signed URLs
- Files remain in S3 but become inaccessible

#### Storage Costs
- Monitor S3 storage usage and costs
- Consider lifecycle policies for old files
- Implement cleanup for expired purchases

### File Structure
```
lib/
  storage-s3.ts              # S3 upload and signed URL helpers

app/api/
  upload/route.ts            # Updated to support S3 uploads
  purchase/route.ts          # Updated to generate signed URLs
  download/route.ts          # Updated to handle S3 redirects

data/
  files.json                 # Extended with s3Key field
  purchases.json            # Purchase records with download URLs
```

### Troubleshooting

#### S3 Upload Fails
- Check AWS credentials and permissions
- Verify bucket name and region
- Check network connectivity
- Review AWS CloudTrail logs

#### Signed URL Issues
- Verify S3 credentials have `GetObject` permission
- Check URL expiry time
- Ensure bucket and key exist
- Test with AWS CLI: `aws s3 presign s3://bucket/key`

#### Fallback Not Working
- Check file exists in `/public/files/`
- Verify token is valid and not expired
- Check server logs for errors

### Production Checklist
- [ ] S3 bucket created with private ACL
- [ ] IAM user with minimal permissions
- [ ] Environment variables set in Vercel
- [ ] File upload works to S3
- [ ] Signed URLs generate correctly
- [ ] Download URLs expire as expected
- [ ] Fallback works when S3 is disabled
- [ ] Demo mode works with S3 enabled
#   V I P   B y p a s s   M o d e   E n a b l e d 
 
 