export interface DigitalAsset {
  id: string;
  title: string;
  description: string;
  priceUsdc: number;
  thumbnail?: string;
  recipient: string;
  createdAt: string;
}

export const SAMPLE_ASSETS: DigitalAsset[] = [
  {
    id: "base-daily-guide",
    title: "Base Daily Complete Guide",
    description: "A comprehensive guide to building on Base with Next.js, Wagmi, and OnchainKit. Includes wallet integration, payment flows, and deployment strategies.",
    priceUsdc: 5.0,
    thumbnail: "/assets/base-daily-guide.jpg",
    recipient: "0x29E2481F55Ac8fb3f7c223E018688D98a514fCca", // Using existing recipient address
    createdAt: new Date().toISOString(),
  },
  {
    id: "onchain-nft-course",
    title: "Onchain NFT Development Course",
    description: "Learn to build, deploy, and mint NFTs on Base. Covers smart contracts, metadata, IPFS, and frontend integration.",
    priceUsdc: 10.0,
    thumbnail: "/assets/nft-course.jpg",
    recipient: "0x29E2481F55Ac8fb3f7c223E018688D98a514fCca",
    createdAt: new Date().toISOString(),
  },
  {
    id: "defi-protocol-tutorial",
    title: "DeFi Protocol Tutorial",
    description: "Build a complete DeFi protocol on Base including liquidity pools, yield farming, and governance tokens.",
    priceUsdc: 15.0,
    thumbnail: "/assets/defi-tutorial.jpg",
    recipient: "0x29E2481F55Ac8fb3f7c223E018688D98a514fCca",
    createdAt: new Date().toISOString(),
  },
];

export function getAssetById(id: string): DigitalAsset | undefined {
  return SAMPLE_ASSETS.find(asset => asset.id === id);
}

export function getAllAssets(): DigitalAsset[] {
  return SAMPLE_ASSETS;
}
