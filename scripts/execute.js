const hre = require("hardhat");

const FACTORY_NONCE = 1;
const FACTORY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const ENTRYPOINT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const PAYMASTER_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {
  const ep = await hre.ethers.getContractAt("EntryPoint", ENTRYPOINT_ADDRESS);

  // Deployer (AccountFactory) deploys EntryPoint
  // CREATE: hash(deployer, nonce) -> address
  // CREATE2: hash(0xFF, deployer, bytecode, salt) -> address
  const sender = await hre.ethers.getCreateAddress({
    from: FACTORY_ADDRESS,
    nonce: FACTORY_NONCE,
  });
  console.log("sender:", sender);

  // initCode: FACTORY_ADDRESS (20 bytes) + AccountFactory.createAccount(address)
  const [signer0, signer1] = await hre.ethers.getSigners();
  const address0 = await signer0.getAddress();
  const AccountFactory = await hre.ethers.getContractFactory("AccountFactory");
  const efd = AccountFactory.interface.encodeFunctionData("createAccount", [
    address0,
  ]);

  // Only the first run
  // const initCode = FACTORY_ADDRESS + efd.slice(2);
  const initCode = "0x";

  // callData belongs to the userOp - it's the data that will be executed by the smart contract
  const Account = await hre.ethers.getContractFactory("Account");
  const callData = Account.interface.encodeFunctionData("execute");

  // Prefund
  // await ep.depositTo(PAYMASTER_ADDRESS, {
  //   value: hre.ethers.parseEther("10"),
  // });

  // Signature
  // const msgHash = hre.ethers.id("wee");
  // const msgBytes = hre.ethers.getBytes(msgHash);
  // const signature = signer0.signMessage(msgBytes);

  // UserOp
  const userOp = {
    sender, // smart contract address
    nonce: await ep.getNonce(sender, 0), // managed by entry point
    initCode: initCode,
    callData: callData,
    callGasLimit: 400_000,
    verificationGasLimit: 400_000,
    preVerificationGas: 100_000,
    maxFeePerGas: hre.ethers.parseUnits("10", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("5", "gwei"),
    paymasterAndData: PAYMASTER_ADDRESS,
    signature: "0x",
  };

  // UserOp Hash
  const userOpHash = await ep.getUserOpHash(userOp);
  userOp.signature = signer0.signMessage(hre.ethers.getBytes(userOpHash));

  const tx = await ep.handleOps([userOp], address0);
  const receipt = await tx.wait();
  console.log("receipt:", receipt);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
