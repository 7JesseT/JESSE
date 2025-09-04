## Base Daily

Base Daily is a minimal, production-ready mini app showcasing daily onchain interactions on Base Sepolia. It includes wallet persistence, mobile-friendly connections, a Tip Jar with recipient selection, and an automated "daily feature + daily tx" flow.

### Highlights
- **Wallet persistence**: Auto-reconnects on reload using localStorage + Wagmi `autoConnect`.
- **Mobile + Desktop**: WalletConnect v2, MetaMask, and Coinbase Wallet supported.
- **Tip Jar with Recipients**: Send native ETH or USDC to Env Club, AI Club, or Dev Club with live tracking.
- **Transaction Tracking**: Real-time totals by recipient with transaction history and Basescan links.
- **Daily automation**: Ships 1 feature and processes 1 transaction after wallet connection each day.
- **Modern stack**: Next.js 14, React 18, Wagmi, Viem, OnchainKit, Tailwind.

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

## License
MIT
