## Base Daily

Base Daily is a minimal, production-ready mini app showcasing daily onchain interactions on Base Sepolia. It includes wallet persistence, mobile-friendly connections, a Tip Jar for sending ETH, and an automated “daily feature + daily tx” flow.

### Highlights
- **Wallet persistence**: Auto-reconnects on reload using localStorage + Wagmi `autoConnect`.
- **Mobile + Desktop**: WalletConnect v2, MetaMask, and Coinbase Wallet supported.
- **Tip Jar**: Send native ETH or USDC (Base Sepolia) with presets and shipment history.
- **Daily automation**: Ships 1 feature and processes 1 transaction after wallet connection each day.
- **Modern stack**: Next.js 14, React 18, Wagmi, Viem, OnchainKit, Tailwind.

---

## Demo (Local)
Run the app and try:
1) Connect a wallet (MetaMask / Coinbase / WalletConnect)
2) Reload — it auto-reconnects
3) Send a tip and see the Basescan link
4) Check the Daily Features section to ship a feature and process a tx

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

# Tip recipients and tokens
NEXT_PUBLIC_TIP_ADDRESS=0xYourTipRecipientAddress
NEXT_PUBLIC_USDC_ADDRESS=0xYOUR_USDC_SEPOLIA_ADDRESS

# Optional: change default paywall price
NEXT_PUBLIC_PAYWALL_PRICE=0.001
```

Notes:
- Tip Jar requires `NEXT_PUBLIC_TIP_ADDRESS` (ETH tips). For USDC tips, set `NEXT_PUBLIC_USDC_ADDRESS` (Base Sepolia USDC). If USDC is not configured, the UI will prompt to use ETH.
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

### Tip Jar (ETH + USDC)
- File: `components/tip-jar.tsx`
  - ETH: `useSendTransaction` with `parseEther(amount)` to `NEXT_PUBLIC_TIP_ADDRESS`.
  - USDC: ERC-20 `transfer(recipient, amount)` with `parseUnits(amount, 6)` to `NEXT_PUBLIC_USDC_ADDRESS`.
  - Currency selector, presets (0.5, 1, 2), manual input, recipient field.
  - Success panel with tx hash, copy, and Basescan link. Stores `{ txHash, amount, currency, recipient, timestamp }` to `localStorage` under `baseDaily:txs`.
  - Latest 3 shipments shown inline with link to `/shipments`.

### Shipments
- Page: `/shipments` displays all stored tips from `localStorage` with time, amount+currency, recipient, Basescan link, and copy tx hash.

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

### Change chain or RPC
- Update `lib/wagmi.ts` chains and `NEXT_PUBLIC_RPC_URL`.

### Add/modify daily features
- Edit `AVAILABLE_FEATURES` in `lib/daily-features.ts`.

### Adjust persistence behavior
- Edit `isWalletConnectionValid` (expiry window, validation) in `lib/wallet-persistence.ts`.

---

## Troubleshooting
- Tip Jar button disabled
  - Ensure wallet is connected and `NEXT_PUBLIC_TIP_ADDRESS` is a valid 0x address.
- Wallet won’t auto-reconnect
  - Check browser console; verify localStorage is enabled and not cleared.
  - Confirm `autoConnect: true` in `lib/wagmi.ts` and no errors from connectors.
- “Invalid request: params[0].to is a required field”
  - Set `NEXT_PUBLIC_TIP_ADDRESS` and restart the dev server.

---

## Deployment
- Any Next.js-compatible platform (e.g., Vercel, Netlify, AWS). Ensure environment variables are configured in the host.

---

## How to Test TipJar

1. Connect MetaMask (or Base Wallet via WalletConnect).
2. Ensure wallet is on Base Sepolia (RPC provided in `.env.local`).
3. Use presets (0.5, 1, 2) or enter a custom amount.
4. Send tip. After success, click the Basescan link to view the tx.
5. Visit `/shipments` to see stored transactions (saved to `localStorage`).

What I shipped: After tip, capture tx hash, copy it, and paste in the tracker.

### Health Check
- Endpoint: `/health` returns `OK`.
- Script: `pnpm run health:curl` prints the curl command; then run it while dev server is running.

### 30s voiceover script
“This is Base Daily. Connect your wallet, pick ETH or USDC, tap a preset like one ETH or enter your own amount, and send a tip on Base Sepolia. After it confirms, copy the transaction hash or jump straight to Basescan. Your last shipments show below, and you can see the full list at slash shipments. Clone the repo, set `.env.local`, and run `pnpm dev` to try it.”

### 60s voiceover script
“Welcome to Base Daily, a minimal Next.js starter for shipping onchain interactions fast. It’s wired up with Wagmi, Viem, and OnchainKit. The Tip Jar now supports ETH and USDC on Base Sepolia. Choose a currency, tap a preset—0.5, 1, or 2—or type a custom amount. ETH uses a native transfer; USDC calls ERC‑20 transfer with 6‑decimals. After success, we show the transaction hash with a copy button and a Basescan link. Every shipment is saved to localStorage and listed on the shipments page, so you can track what you shipped. Setup is simple: set the RPC URL, tip recipient, and optional USDC address in `.env.local`, then `pnpm dev`. There’s also a `/health` endpoint for sanity checks. Fork it, deploy to Vercel, and start shipping.”

### Deploy (Vercel)
Configure `NEXT_PUBLIC_USDC_ADDRESS` in the project settings if you want USDC tips enabled.

## License
MIT

# Base Daily

A Next.js 14 application for daily onchain interactions on Base Sepolia, built with OnchainKit, wagmi, and TailwindCSS.

## Features

- **Connect Wallet**: Seamless wallet connection using OnchainKit
- **Tip Jar**: Send ETH tips to creators on Base Sepolia
- **Mint Attendance**: Mint ERC-1155 attendance NFTs
- **Paywall**: Access premium content after payment

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A wallet with Base Sepolia ETH for testing

### Installation

1. Clone the repository:
\`\`\`bash
git clone <your-repo-url>
cd base-daily
\`\`\`

2. Install dependencies:
\`\`\`bash
pnpm install
\`\`\`

3. Copy environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Update `.env.local` with your configuration:
   - `NEXT_PUBLIC_ONCHAINKIT_API_KEY`: Get from Coinbase Developer Platform
   - Contract addresses for your deployed contracts
   - Adjust tip address and paywall price as needed

5. Run the development server:
\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Or use the Vercel CLI:
\`\`\`bash
npx vercel
\`\`\`

## Project Structure

- `/app` - Next.js 14 app router pages
- `/components` - React components
- `/lib` - Utility functions and configurations
- `/public` - Static assets and metadata
- `/api` - API routes for minting and payments

## Technologies

- Next.js 14 (App Router)
- TypeScript
- OnchainKit
- wagmi/viem
- TailwindCSS
- Base Sepolia testnet

## License

MIT
