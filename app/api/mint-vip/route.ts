import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, createWalletClient, http, parseAbi } from "viem"
import { baseSepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { promises as fs } from "fs"
import path from "path"

const VIP_CONTRACT = process.env.NEXT_PUBLIC_VIP_CONTRACT as `0x${string}`
const ATTENDANCE_CONTRACT = process.env.NEXT_PUBLIC_ATTENDANCE_CONTRACT as `0x${string}`
const PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY as `0x${string}`

// Use VIP contract if available, otherwise fall back to attendance contract
const CONTRACT_ADDRESS = VIP_CONTRACT || ATTENDANCE_CONTRACT
const MINTS_PATH = path.resolve(process.cwd(), "data/mints.json")

// ERC-1155 ABI for minting
const erc1155Abi = parseAbi([
  "function mint(address to, uint256 id, uint256 amount, bytes data) external",
  "function uri(uint256 id) external view returns (string)",
])

export async function POST(request: NextRequest) {
  try {
    const { to, tokenId, amount } = await request.json()

    if (!to || !tokenId || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    if (!CONTRACT_ADDRESS || !PRIVATE_KEY) {
      return NextResponse.json({ error: "Contract or private key not configured" }, { status: 500 })
    }

    console.log(`VIP Mint Request - Wallet: ${to}, Token ID: ${tokenId}, Amount: ${amount}`)

    // Read mints.json
    let mints: any[] = []
    try {
      const raw = await fs.readFile(MINTS_PATH, "utf-8")
      mints = JSON.parse(raw)
    } catch {
      mints = []
    }

    // Check if user already has a VIP pass
    const existingVipMint = mints.find(m => m.wallet === to && m.event === "vip")
    if (existingVipMint) {
      console.log(`VIP Mint Blocked - Wallet: ${to} already has VIP pass`)
      return NextResponse.json({ error: "You already have a VIP Pass" }, { status: 403 })
    }

    // Create clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL),
    })
    const account = privateKeyToAccount(PRIVATE_KEY)
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL),
    })

    // Mint the VIP Pass NFT
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: erc1155Abi,
      functionName: "mint",
      args: [to as `0x${string}`, BigInt(tokenId), BigInt(amount), "0x"],
    })

    console.log(`VIP Mint Transaction Submitted - Wallet: ${to}, TX: ${hash}`)

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Update mints.json
    const mintRecord = {
      wallet: to,
      event: "vip",
      time: new Date().toISOString(),
      txHash: hash,
      tokenId: tokenId,
      amount: amount,
    }
    mints.push(mintRecord)
    await fs.writeFile(MINTS_PATH, JSON.stringify(mints, null, 2))

    console.log(`VIP Mint Success - Wallet: ${to}, TX: ${hash}, Block: ${receipt.blockNumber}`)

    return NextResponse.json({
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    })
  } catch (error) {
    console.error("VIP Minting error:", error)
    return NextResponse.json(
      { error: "Failed to mint VIP Pass", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
