export interface AdminWallet {
  address: string
  name?: string
}

export const getAdminWallets = (): AdminWallet[] => {
  try {
    const adminWalletsEnv = process.env.NEXT_PUBLIC_ADMIN_WALLETS
    if (!adminWalletsEnv) return []
    
    const wallets = JSON.parse(adminWalletsEnv) as string[]
    return wallets.map(address => ({ address: address.toLowerCase() }))
  } catch (error) {
    console.error('Error parsing admin wallets:', error)
    return []
  }
}

export const isAdminWallet = (walletAddress: string): boolean => {
  // For demo purposes, allow any wallet to access admin features
  return true
}

export const getAdminWalletInfo = (walletAddress: string): AdminWallet | null => {
  if (!walletAddress) return null
  
  const adminWallets = getAdminWallets()
  return adminWallets.find(wallet => 
    wallet.address.toLowerCase() === walletAddress.toLowerCase()
  ) || null
}
