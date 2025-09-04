export type Recipient = {
  id: string
  name: string
  ethAddress: `0x${string}`
  usdcAddress: `0x${string}`
}

export const RECIPIENTS: Recipient[] = [
  {
    id: "env-club",
    name: "Env Club",
    ethAddress: "0x742d35Cc6634C0532925a3b8D0C0C1C2C3C4C5C6", // Placeholder - replace with actual address
    usdcAddress: "0x742d35Cc6634C0532925a3b8D0C0C1C2C3C4C5C6", // Placeholder - replace with actual address
  },
  {
    id: "ai-club",
    name: "AI Club", 
    ethAddress: "0x852d35Cc6634C0532925a3b8D0C0C1C2C3C4C5C7", // Placeholder - replace with actual address
    usdcAddress: "0x852d35Cc6634C0532925a3b8D0C0C1C2C3C4C5C7", // Placeholder - replace with actual address
  },
  {
    id: "dev-club",
    name: "Dev Club",
    ethAddress: "0x962d35Cc6634C0532925a3b8D0C0C1C2C3C4C5C8", // Placeholder - replace with actual address
    usdcAddress: "0x962d35Cc6634C0532925a3b8D0C0C1C2C3C4C5C8", // Placeholder - replace with actual address
  },
]

export const getRecipientById = (id: string): Recipient | undefined => {
  return RECIPIENTS.find(recipient => recipient.id === id)
}

export const getRecipientAddress = (recipientId: string, currency: "ETH" | "USDC"): `0x${string}` | undefined => {
  const recipient = getRecipientById(recipientId)
  if (!recipient) return undefined
  
  return currency === "ETH" ? recipient.ethAddress : recipient.usdcAddress
}
