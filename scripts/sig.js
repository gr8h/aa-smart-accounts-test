const hre = require("hardhat");

async function main() {
  const [signer0] = await hre.ethers.getSigners();

  const msgHash = hre.ethers.id("wee");
  const msgBytes = hre.ethers.getBytes(msgHash);
  const signature = signer0.signMessage(msgBytes);

  const Test = await hre.ethers.getContractFactory("Test");
  const test = await Test.deploy(signature);

  console.log("address0:", signer0.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
