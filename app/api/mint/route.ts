import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, createWalletClient, http, parseAbi } from "viem"
import { baseSepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { promises as fs } from "fs"
import path from "path"
import { createTransaction } from "@/lib/transactions"

const ATTENDANCE_CONTRACT = process.env.NEXT_PUBLIC_ATTENDANCE_CONTRACT as `0x${string}`
const PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY as `0x${string}`
const MINTS_PATH = path.resolve(process.cwd(), "data/mints.json")

// ERC-1155 ABI for minting
const erc1155Abi = parseAbi([
  "function mint(address to, uint256 id, uint256 amount, bytes data) external",
  "function uri(uint256 id) external view returns (string)",
])

export async function POST(request: NextRequest) {
  try {
    const { to, tokenId, amount, event = "week1" } = await request.json()

    if (!to || !tokenId || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    if (!ATTENDANCE_CONTRACT || !PRIVATE_KEY) {
      return NextResponse.json({ error: "Contract or private key not configured" }, { status: 500 })
    }

    // Read mints.json
    let mints: any[] = []
    try {
      const raw = await fs.readFile(MINTS_PATH, "utf-8")
      mints = JSON.parse(raw)
    } catch {
      mints = []
    }
    const eventMints = mints.filter((m) => m.event === event)
    if (eventMints.length >= 50) {
      return NextResponse.json({ error: "Mint limit reached for this event" }, { status: 403 })
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

    // Mint the NFT
    const hash = await walletClient.writeContract({
      address: ATTENDANCE_CONTRACT,
      abi: erc1155Abi,
      functionName: "mint",
      args: [to as `0x${string}`, BigInt(tokenId), BigInt(amount), "0x"],
    })

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Update mints.json
    const mintRecord = {
      wallet: to,
      event,
      time: new Date().toISOString(),
      txHash: hash,
    }
    mints.push(mintRecord)
    await fs.writeFile(MINTS_PATH, JSON.stringify(mints, null, 2))

    // Create transaction record
    await createTransaction({
      user: to,
      amount: 0, // NFT mints are typically free
      currency: 'ETH',
      type: 'nft_mint',
      status: 'confirmed', // NFT mint is confirmed when transaction succeeds
      timestamp: new Date().toISOString(),
      txHash: hash,
      metadata: {
        event,
        tokenId: tokenId.toString()
      }
    })

    return NextResponse.json({
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    })
  } catch (error) {
    console.error("Minting error:", error)
    return NextResponse.json(
      { error: "Failed to mint NFT", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
