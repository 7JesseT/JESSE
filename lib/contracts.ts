import { parseAbi } from "viem"

// ERC-1155 Contract ABI
export const erc1155Abi = parseAbi([
  "function mint(address to, uint256 id, uint256 amount, bytes data) external",
  "function burn(address from, uint256 id, uint256 amount) external",
  "function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) external",
  "function uri(uint256 id) external view returns (string)",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function setURI(string memory newuri) external",
  "function supportsInterface(bytes4 interfaceId) external view returns (bool)",
])

// Simple payment contract ABI for tips and paywall
export const paymentAbi = parseAbi(["function transfer() external payable", "receive() external payable"])

// Contract addresses
export const CONTRACTS = {
  ATTENDANCE: process.env.NEXT_PUBLIC_ATTENDANCE_CONTRACT as `0x${string}`,
  VIP: process.env.NEXT_PUBLIC_VIP_CONTRACT as `0x${string}`,
  TIP_JAR: process.env.NEXT_PUBLIC_TIP_ADDRESS as `0x${string}`,
} as const
