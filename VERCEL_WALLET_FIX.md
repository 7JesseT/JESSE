# Vercel Wallet Connection Fix Guide

## 🚨 Problem
MetaMask auto-detection works locally but not on Vercel deployment.

## 🔧 Root Causes & Solutions

### 1. **Missing Environment Variables**
The most common cause is missing environment variables on Vercel.

#### Required Environment Variables:
```bash
# WalletConnect Project ID (CRITICAL for wallet connections)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Base URL for your Vercel deployment
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# RPC URLs (optional but recommended)
NEXT_PUBLIC_RPC_URL_SEPOLIA=https://sepolia.base.org
NEXT_PUBLIC_RPC_URL_MAINNET=https://mainnet.base.org
```

### 2. **How to Set Environment Variables on Vercel:**

#### Method 1: Vercel Dashboard
1. Go to your project on [vercel.com](https://vercel.com)
2. Click on **Settings** tab
3. Click on **Environment Variables** in the sidebar
4. Add each variable:
   - **Name**: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - **Value**: Your WalletConnect project ID
   - **Environment**: Production, Preview, Development
5. Click **Save**
6. Repeat for all required variables

#### Method 2: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
vercel env add NEXT_PUBLIC_BASE_URL
vercel env add NEXT_PUBLIC_RPC_URL_SEPOLIA
vercel env add NEXT_PUBLIC_RPC_URL_MAINNET

# Redeploy after adding variables
vercel --prod
```

### 3. **Get WalletConnect Project ID:**
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up/Login
3. Create a new project
4. Copy the Project ID
5. Add it to your Vercel environment variables

### 4. **Domain Configuration Issues:**

#### Update your Vercel domain settings:
1. In Vercel dashboard → Settings → Domains
2. Make sure your custom domain is properly configured
3. Update `NEXT_PUBLIC_BASE_URL` to match your actual domain

### 5. **Common Vercel-Specific Issues:**

#### Issue: WalletConnect metadata mismatch
**Solution**: The updated `lib/wagmi.ts` now dynamically detects the domain:
```typescript
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
}
```

#### Issue: MetaMask not detecting the dapp
**Solution**: Added proper dapp metadata:
```typescript
metaMask({
  dappMetadata: {
    name: "Base Daily",
    url: getBaseUrl(),
    iconUrl: `${getBaseUrl()}/placeholder-logo.svg`,
  },
})
```

### 6. **Testing Steps:**

1. **Set Environment Variables** (most important!)
2. **Redeploy** your Vercel app
3. **Test wallet connection** on the live site
4. **Check browser console** for any errors
5. **Verify MetaMask** shows your app in "Connected Sites"

### 7. **Debugging Tips:**

#### Check if environment variables are loaded:
Add this to your app temporarily:
```typescript
console.log('WalletConnect Project ID:', process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID)
console.log('Base URL:', process.env.NEXT_PUBLIC_BASE_URL)
```

#### Check browser console for errors:
- Open DevTools → Console
- Look for wallet connection errors
- Check network tab for failed requests

#### Verify MetaMask connection:
- Open MetaMask
- Go to Settings → Connected Sites
- Your app should appear there

### 8. **Quick Fix Checklist:**

- [ ] Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in Vercel
- [ ] Set `NEXT_PUBLIC_BASE_URL` to your Vercel domain
- [ ] Redeploy the app
- [ ] Clear browser cache
- [ ] Test on incognito mode
- [ ] Check browser console for errors

### 9. **If Still Not Working:**

1. **Check Vercel Function Logs:**
   - Go to Vercel dashboard → Functions tab
   - Look for any server-side errors

2. **Test with WalletConnect:**
   - Try connecting with WalletConnect instead of MetaMask
   - This helps isolate if it's a MetaMask-specific issue

3. **Verify Network Configuration:**
   - Make sure you're on the correct network (Base Sepolia/Mainnet)
   - Check if RPC URLs are working

## 🎯 Most Likely Solution:
**Set the `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` environment variable in Vercel dashboard and redeploy.**

This single step fixes 90% of wallet connection issues on Vercel!
