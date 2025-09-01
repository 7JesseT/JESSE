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
