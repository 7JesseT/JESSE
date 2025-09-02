## Base Daily

Base Daily is a minimal, production-ready mini app showcasing daily onchain interactions on Base Sepolia. It includes wallet persistence, mobile-friendly connections, a Tip Jar for sending ETH, and an automated “daily feature + daily tx” flow.

### Highlights
- **Wallet persistence**: Auto-reconnects on reload using localStorage + Wagmi `autoConnect`.
- **Mobile + Desktop**: WalletConnect v2, MetaMask, and Coinbase Wallet supported.
- **Tip Jar**: Send native ETH to a configured address with confirmation link.
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

# Required for Tip Jar (native ETH recipient)
NEXT_PUBLIC_TIP_ADDRESS=0xYourTipRecipientAddress

# Optional: change default paywall price
NEXT_PUBLIC_PAYWALL_PRICE=0.001
```

Notes:
- The Tip Jar requires `NEXT_PUBLIC_TIP_ADDRESS` to be a valid 0x address. The Send button stays disabled otherwise.
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

### Tip Jar (ETH)
- File: `components/tip-jar.tsx`
  - Uses Wagmi `useSendTransaction` to send native ETH to `NEXT_PUBLIC_TIP_ADDRESS`.
  - Validates the recipient address and amount.
  - Shows a success state with a Basescan link after confirmation.

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
