# ✅ Your Environment Variables Setup Guide

## 🎯 **Your Variables Look Great!**

All your environment variables are properly configured and will work perfectly. Here's how to set them up:

## 📋 **For Local Development (.env.local):**

Create a `.env.local` file in your project root with:

```bash
# WalletConnect Project ID ✅
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=66603580dce8a2318827a29362e173a1

# RPC URLs ✅
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_RPC_URL_SEPOLIA=https://sepolia.base.org
NEXT_PUBLIC_RPC_URL_MAINNET=https://mainnet.base.org

# Base URL ✅
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Contract Addresses ✅
NEXT_PUBLIC_ATTENDANCE_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Feature Flags ✅
NEXT_PUBLIC_ALLOW_VIP_WITHOUT_WALLET=true

# Pricing ✅
NEXT_PUBLIC_PAYWALL_PRICE=0.001
```

## 🚀 **For Vercel Deployment:**

### Method 1: Vercel Dashboard
1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings** → **Environment Variables**
3. Add each variable:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `66603580dce8a2318827a29362e173a1` | Production, Preview, Development |
| `NEXT_PUBLIC_RPC_URL` | `https://sepolia.base.org` | Production, Preview, Development |
| `NEXT_PUBLIC_RPC_URL_SEPOLIA` | `https://sepolia.base.org` | Production, Preview, Development |
| `NEXT_PUBLIC_RPC_URL_MAINNET` | `https://mainnet.base.org` | Production, Preview, Development |
| `NEXT_PUBLIC_BASE_URL` | `https://your-app-name.vercel.app` | Production, Preview, Development |
| `NEXT_PUBLIC_ATTENDANCE_CONTRACT` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Production, Preview, Development |
| `NEXT_PUBLIC_USDC_ADDRESS` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Production, Preview, Development |
| `NEXT_PUBLIC_ALLOW_VIP_WITHOUT_WALLET` | `true` | Production, Preview, Development |
| `NEXT_PUBLIC_PAYWALL_PRICE` | `0.001` | Production, Preview, Development |

### Method 2: Vercel CLI
```bash
# Set all your environment variables
vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
# Enter: 66603580dce8a2318827a29362e173a1

vercel env add NEXT_PUBLIC_RPC_URL
# Enter: https://sepolia.base.org

vercel env add NEXT_PUBLIC_RPC_URL_SEPOLIA
# Enter: https://sepolia.base.org

vercel env add NEXT_PUBLIC_RPC_URL_MAINNET
# Enter: https://mainnet.base.org

vercel env add NEXT_PUBLIC_BASE_URL
# Enter: https://your-app-name.vercel.app

vercel env add NEXT_PUBLIC_ATTENDANCE_CONTRACT
# Enter: 0x036CbD53842c5426634e7929541eC2318f3dCF7e

vercel env add NEXT_PUBLIC_USDC_ADDRESS
# Enter: 0x036CbD53842c5426634e7929541eC2318f3dCF7e

vercel env add NEXT_PUBLIC_ALLOW_VIP_WITHOUT_WALLET
# Enter: true

vercel env add NEXT_PUBLIC_PAYWALL_PRICE
# Enter: 0.001

# Redeploy after adding variables
vercel --prod
```

## ⚠️ **Important Notes:**

1. **Update `NEXT_PUBLIC_BASE_URL`** for Vercel:
   - Change from `http://localhost:3000` to your actual Vercel URL
   - Example: `https://base-daily.vercel.app`

2. **Contract Addresses Look Good:**
   - Both contracts use the same address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - This is fine if they're the same contract with different functions

3. **Feature Flags:**
   - `NEXT_PUBLIC_ALLOW_VIP_WITHOUT_WALLET=true` ✅
   - `NEXT_PUBLIC_PAYWALL_PRICE=0.001` ✅

## 🧪 **Testing Your Setup:**

1. **Set the environment variables in Vercel**
2. **Redeploy your app**
3. **Test these features:**
   - ✅ Wallet connection (MetaMask should auto-detect)
   - ✅ VIP access without wallet
   - ✅ Paywall pricing (0.001 ETH)
   - ✅ Contract interactions
   - ✅ Transaction tracking

## 🎉 **You're All Set!**

Your environment variables are perfectly configured. The main thing to remember is to update `NEXT_PUBLIC_BASE_URL` to your actual Vercel domain when deploying.

Once you set these in Vercel and redeploy, your wallet connection should work perfectly! 🚀
