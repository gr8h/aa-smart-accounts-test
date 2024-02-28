const hre = require("hardhat");

async function main() {
  // // EntryPoint
  // const ep = await hre.ethers.deployContract("EntryPoint");
  // await ep.waitForDeployment();
  // console.log("EP deployed to:", ep.target);
  // // Account
  // const af = await hre.ethers.deployContract("AccountFactory");
  // await af.waitForDeployment();
  // console.log("AF deployed to:", af.target);
  // Paymaster
  const pm = await hre.ethers.deployContract("Paymaster");
  await pm.waitForDeployment();
  console.log("PM deployed to:", pm.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// EP deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
// AF deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
// PM deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

// ARB
// AF deployed to: 0x06a60d0038c03E185AE0C121eee30E4d1FaA6c6C
// PM deployed to: 0x27B79f3273db94f08Ff8d320F19FA171324e4B27

// FUSE
// AF deployed to: 0xF2ea531B15a98DB42bdC4dfF7C57ad0E17E2E50E
