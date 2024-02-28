const hre = require("hardhat");

const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const FACTORY_ADDRESS = "0x4b07F8c6AB74f43BFC3439598424cCfC0112Cc51";
const PAYMASTER_ADDRESS = "0x27B79f3273db94f08Ff8d320F19FA171324e4B27";

async function main() {
  const ep = await hre.ethers.getContractAt("EntryPoint", ENTRYPOINT_ADDRESS);

  const [signer0] = await hre.ethers.getSigners();
  const address0 = await signer0.getAddress();

  const AccountFactory = await hre.ethers.getContractFactory("AccountFactory");
  const efd = AccountFactory.interface.encodeFunctionData("createAccount", [
    address0,
  ]);
  let initCode = FACTORY_ADDRESS + efd.slice(2);

  // Sender
  let sender;
  try {
    await ep.getSenderAddress(initCode);
  } catch (error) {
    // console.error("sender:", error.data.data.slice(-40));
    sender = "0x" + error.data.slice(-40);
  }
  console.log("sender:", sender);

  // Account
  const code = await hre.ethers.provider.getCode(sender);
  if (code !== "0x") {
    initCode = "0x";
  }

  // callData belongs to the userOp - it's the data that will be executed by the smart contract
  const Account = await hre.ethers.getContractFactory("Account");
  const callData = Account.interface.encodeFunctionData("execute");

  // UserOp
  const userOp = {
    sender, // smart contract address
    nonce: "0x" + (await ep.getNonce(sender, 0)).toString(16), // managed by entry point
    initCode: initCode,
    callData: callData,
    paymasterAndData: PAYMASTER_ADDRESS,
    signature:
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
  };

  const { preVerificationGas, verificationGasLimit, callGasLimit } =
    await hre.ethers.provider.send("eth_estimateUserOperationGas", [
      userOp,
      ENTRYPOINT_ADDRESS,
    ]);

  userOp.preVerificationGas = preVerificationGas;
  userOp.verificationGasLimit = verificationGasLimit;
  userOp.callGasLimit = callGasLimit;

  const { maxFeePerGas } = await hre.ethers.provider.getFeeData();
  userOp.maxFeePerGas = "0x" + maxFeePerGas.toString(16);

  const maxPriorityFeePerGas = await hre.ethers.provider.send(
    "rundler_maxPriorityFeePerGas"
  );
  userOp.maxPriorityFeePerGas = maxPriorityFeePerGas;

  // UserOp Hash
  const userOpHash = await ep.getUserOpHash(userOp);
  userOp.signature = await signer0.signMessage(hre.ethers.getBytes(userOpHash));

  console.log("userOp:", userOp);

  // Execute
  const userOpHashResult = await hre.ethers.provider.send(
    "eth_sendUserOperation",
    [userOp, ENTRYPOINT_ADDRESS]
  );

  console.log("userOpHashResult:", userOpHashResult);

  setTimeout(async () => {
    const { transactionHash } = await hre.ethers.provider.send(
      "eth_getUserOperationByHash",
      [userOpHashResult]
    );

    console.log("transactionHash:", transactionHash);
  }, 9000);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
