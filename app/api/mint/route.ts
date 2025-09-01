import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, createWalletClient, http, parseAbi } from "viem"
import { baseSepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

const ATTENDANCE_CONTRACT = process.env.NEXT_PUBLIC_ATTENDANCE_CONTRACT as `0x${string}`
const PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY as `0x${string}`

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

    if (!ATTENDANCE_CONTRACT || !PRIVATE_KEY) {
      return NextResponse.json({ error: "Contract or private key not configured" }, { status: 500 })
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
