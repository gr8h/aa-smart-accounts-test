const hre = require("hardhat");

const ACCOUNT_ADDRESS = "0xcf0367db9a2c86fc72a0c07590fff007dba089e3";
const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const PAYMASTER_ADDRESS = "0xB38f8155AD5439F68A5fBd3933Ec75AB9f6143aC";

async function main() {
  // Account
  const Account = await hre.ethers.getContractAt("Account", ACCOUNT_ADDRESS);
  // const count = await Account.count();
  // console.log("count:", count);

  console.log(
    "account balance:",
    await hre.ethers.provider.getBalance(ACCOUNT_ADDRESS)
  );

  // EntryPoint
  const EntryPoint = await hre.ethers.getContractAt(
    "EntryPoint",
    ENTRYPOINT_ADDRESS
  );

  console.log(
    "account balance on EP:",
    await EntryPoint.balanceOf(ACCOUNT_ADDRESS)
  );

  // Paymaster
  console.log(
    "paymaster balance:",
    await EntryPoint.balanceOf(PAYMASTER_ADDRESS)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
