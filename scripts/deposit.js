const hre = require("hardhat");

const PAYMASTER_ADDRESS = "0xB38f8155AD5439F68A5fBd3933Ec75AB9f6143aC";
const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

async function main() {
  const ep = await hre.ethers.getContractAt("EntryPoint", ENTRYPOINT_ADDRESS);

  // Prefund
  await ep.depositTo(PAYMASTER_ADDRESS, {
    value: hre.ethers.parseEther("1.5"),
  });

  console.log("Done");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
