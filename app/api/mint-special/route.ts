import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, createWalletClient, http, parseAbi } from "viem"
import { baseSepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { promises as fs } from "fs"
import path from "path"

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
    const { to, tokenId = 2, amount = 1 } = await request.json()

    if (!to) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 })
    }

    if (!ATTENDANCE_CONTRACT || !PRIVATE_KEY) {
      return NextResponse.json({ error: "Contract or private key not configured" }, { status: 500 })
    }

    console.log(`Special NFT Mint Request - Wallet: ${to}, Token ID: ${tokenId}, Amount: ${amount}`)

    // Read mints.json
    let mints: any[] = []
    try {
      const raw = await fs.readFile(MINTS_PATH, "utf-8")
      mints = JSON.parse(raw)
    } catch {
      mints = []
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

    // Mint the Special NFT
    const hash = await walletClient.writeContract({
      address: ATTENDANCE_CONTRACT,
      abi: erc1155Abi,
      functionName: "mint",
      args: [to as `0x${string}`, BigInt(tokenId), BigInt(amount), "0x"],
    })

    console.log(`Special NFT Mint Transaction Submitted - Wallet: ${to}, TX: ${hash}`)

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Update mints.json
    const mintRecord = {
      wallet: to,
      event: "special",
      time: new Date().toISOString(),
      txHash: hash,
      tokenId: tokenId,
      amount: amount,
    }
    mints.push(mintRecord)
    await fs.writeFile(MINTS_PATH, JSON.stringify(mints, null, 2))

    console.log(`Special NFT Mint Success - Wallet: ${to}, TX: ${hash}, Block: ${receipt.blockNumber}`)

    // Create audit log for special mint
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'special-mint',
          actor: account.address,
          user: to,
          details: {
            txHash: hash,
            tokenId: tokenId.toString(),
            amount: amount.toString(),
            event: 'special',
            contractAddress: ATTENDANCE_CONTRACT
          },
          metadata: `Special NFT mint: token ${tokenId} to ${to}`
        })
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json({
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    })
  } catch (error) {
    console.error("Special NFT Minting error:", error)
    return NextResponse.json(
      { error: "Failed to mint Special NFT", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
