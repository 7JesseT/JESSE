// Deployment script for the AttendanceNFT contract
// Run with: node scripts/deploy-contracts.js

const { ethers } = require("ethers")
const fs = require("fs")

async function deployAttendanceNFT() {
  // Configure provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
  const wallet = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, provider)

  console.log("Deploying AttendanceNFT contract...")
  console.log("Deployer address:", wallet.address)

  // Contract bytecode and ABI would go here
  // This is a simplified example - in practice you'd compile the Solidity contract

  const contractFactory = new ethers.ContractFactory(
    [], // ABI would go here
    "0x", // Bytecode would go here
    wallet,
  )

  try {
    const contract = await contractFactory.deploy(wallet.address)
    await contract.waitForDeployment()

    const contractAddress = await contract.getAddress()
    console.log("AttendanceNFT deployed to:", contractAddress)

    // Update .env file with contract address
    const envContent = fs.readFileSync(".env.local", "utf8")
    const updatedEnv = envContent.replace(
      /NEXT_PUBLIC_ATTENDANCE_CONTRACT=.*/,
      `NEXT_PUBLIC_ATTENDANCE_CONTRACT=${contractAddress}`,
    )
    fs.writeFileSync(".env.local", updatedEnv)

    console.log("Contract address updated in .env.local")
  } catch (error) {
    console.error("Deployment failed:", error)
  }
}

// Run deployment
if (require.main === module) {
  deployAttendanceNFT().catch(console.error)
}
