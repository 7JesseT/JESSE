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

export async function GET() {
  try {
    // Read mints.json
    let mints: any[] = []
    try {
      const raw = await fs.readFile(MINTS_PATH, "utf-8")
      mints = JSON.parse(raw)
    } catch {
      mints = []
    }

    return NextResponse.json({ mints })
  } catch (error) {
    console.error("Error reading mints:", error)
    return NextResponse.json({ error: "Failed to read mints" }, { status: 500 })
  }
}

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

    // Create audit log for mint
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'mint',
          actor: account.address,
          user: to,
          details: {
            txHash: hash,
            tokenId: tokenId.toString(),
            amount: amount.toString(),
            event,
            contractAddress: ATTENDANCE_CONTRACT
          },
          metadata: `NFT mint: token ${tokenId} to ${to} for event ${event}`
        })
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    // Trigger notification for successful mint
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'success',
          category: 'mint',
          title: 'NFT Minted',
          message: 'NFT minting completed successfully.',
          autoDismiss: true,
          dismissAfter: 5000,
        }),
      });
    } catch (notificationError) {
      console.error('Failed to send mint notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    })
  } catch (error) {
    console.error("Minting error:", error)
    
    // Trigger notification for failed mint
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'error',
          category: 'mint',
          title: 'Mint Failed',
          message: `NFT minting failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          autoDismiss: false,
        }),
      });
    } catch (notificationError) {
      console.error('Failed to send mint failure notification:', notificationError);
    }
    
    return NextResponse.json(
      { error: "Failed to mint NFT", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
