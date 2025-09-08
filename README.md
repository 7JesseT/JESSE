
## Base Daily

Base Daily is a minimal, production-ready mini app showcasing daily onchain interactions on Base Sepolia. It includes wallet persistence, mobile-friendly connections, a Tip Jar with recipient selection, Shipments Log, Attendance QR Minting, and an automated "daily feature + daily tx" flow.

### Highlights
- **Wallet persistence**: Auto-reconnects on reload using localStorage + Wagmi `autoConnect`.
- **Mobile + Desktop**: WalletConnect v2, MetaMask, and Coinbase Wallet supported.
- **Tip Jar with Recipients**: Send native ETH or USDC to Env Club, AI Club, or Dev Club with live tracking.
- **Transaction Tracking**: Real-time totals by recipient with transaction history and Basescan links.
- **Daily automation**: Ships 1 feature and processes 1 transaction after wallet connect
ion each day.
- **Modern stack**: Next.js 14, React 18, Wagmi, Viem, OnchainKit, Tailwind.

---

## New Features

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

### 1) Prerequisites
- Node.js 18+
- A Base Sepolia RPC endpoint
- WalletConnect Project ID (free at `https://cloud.walletconnect.com`)

### 2) Install
```bash
pnpm i
# or
npm i
# or
yarn
```

### 3) Configure environment
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_key

# USDC token address (Base Sepolia)
NEXT_PUBLIC_USDC_ADDRESS=0xYOUR_USDC_SEPOLIA_ADDRESS

# Optional: change default paywall price
NEXT_PUBLIC_PAYWALL_PRICE=0.001
```

Notes:
- Recipient addresses are configured in `/config/recipients.ts` - update the placeholder addresses with actual club addresses.
- For USDC tips, set `NEXT_PUBLIC_USDC_ADDRESS` (Base Sepolia USDC). If USDC is not configured, the UI will prompt to use ETH.
- The app targets Base Sepolia by default.

### 4) Run
```bash
pnpm dev
# or npm run dev / yarn dev
```

Open `http://localhost:3000`.

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
