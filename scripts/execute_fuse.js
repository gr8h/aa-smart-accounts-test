const hre = require("hardhat");
require("dotenv").config();

const viem = require("viem");
const permissionless = require("permissionless");
const pimlico = require("permissionless/actions/pimlico");
const fuseChain = require("viem/chains").fuse;
const viemaccount = require("viem/accounts");
const pm = require("permissionless/clients/pimlico");

const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
// const FACTORY_ADDRESS = "0xF2ea531B15a98DB42bdC4dfF7C57ad0E17E2E50E";
const SIMPLE_ACCOUNT_FACTORY_ADDRESS =
  "0x9406Cc6185a346906296840746125a0E44976454";
const PAYMASTER_ADDRESS = "0xB38f8155AD5439F68A5fBd3933Ec75AB9f6143aC";

async function main() {
  // Pimlico
  const chain = "fuse"; // find the list of chain names on the Pimlico verifying paymaster reference page
  const apiKey = "3f7c5ec4-4fc6-457a-9e53-8cb9bd7d759e"; // REPLACE THIS

  const publicClient = viem.createPublicClient({
    transport: viem.http("https://pimlico.bundler.rpc.fuse.io/"),
    chain: fuseChain,
  });

  const bundlerClient = viem
    .createClient({
      transport: viem.http(
        `https://api.pimlico.io/v1/${chain}/rpc?apikey=${apiKey}`
      ),
      chain: fuseChain,
    })
    .extend(permissionless.bundlerActions)
    .extend(pimlico.pimlicoBundlerActions);

  const supportedEntryPoints = await bundlerClient.supportedEntryPoints();
  console.log("supportedEntryPoints:", supportedEntryPoints);

  // Account
  const [signer0] = await hre.ethers.getSigners();
  const address0 = await signer0.getAddress();

  // EntryPoint
  const ep = await hre.ethers.getContractAt("EntryPoint", ENTRYPOINT_ADDRESS);

  // Generate the initCode
  const initCode = viem.concat([
    SIMPLE_ACCOUNT_FACTORY_ADDRESS,
    viem.encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: "owner", type: "address" },
            { name: "salt", type: "uint256" },
          ],
          name: "createAccount",
          outputs: [{ name: "ret", type: "address" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      args: [address0, 0n],
    }),
  ]);

  // Sender Address
  // const senderAddressx = await permissionless.getSenderAddress(publicClient, {
  //   initCode,
  //   entryPoint: ENTRYPOINT_ADDRESS,
  // });
  // console.log("senderAddressx:", senderAddressx);

  let senderAddress;
  try {
    await ep.getSenderAddress(initCode);
  } catch (error) {
    // console.error("sender error:", error);
    senderAddress = "0x" + error.toString().slice(-40);
  }
  console.log("senderAddress:", senderAddress);

  // Is initCode deployed?
  const code = await hre.ethers.provider.getCode(senderAddress);
  if (code !== "0x") {
    initCode = "0x";
  }
  console.log("Generated initCode:", initCode);

  // Generate the callData
  const to = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik
  const value = 0n;
  const data = "0x68656c6c6f"; // "hello" encoded to utf-8 bytes

  const callData = viem.encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "dest", type: "address" },
          { name: "value", type: "uint256" },
          { name: "func", type: "bytes" },
        ],
        name: "execute",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    args: [to, value, data],
  });

  console.log("Generated callData:", callData);

  // UserOp
  const userOp = {
    sender: senderAddress,
    nonce: "0x" + (await ep.getNonce(senderAddress, 0)).toString(16), // managed by entry point
    initCode: initCode,
    callData: callData,
    paymasterAndData: "0x", //PAYMASTER_ADDRESS,
    signature:
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
  };
  const gasPrices = await bundlerClient.getUserOperationGasPrice();
  userOp.maxFeePerGas = gasPrices.fast.maxFeePerGas;
  userOp.maxPriorityFeePerGas = gasPrices.fast.maxPriorityFeePerGas;

  const { preVerificationGas, verificationGasLimit, callGasLimit } =
    await bundlerClient.estimateUserOperationGas({
      userOperation: userOp,
      entryPoint: ENTRYPOINT_ADDRESS,
    });
  userOp.preVerificationGas = preVerificationGas;
  userOp.verificationGasLimit = verificationGasLimit;
  userOp.callGasLimit = callGasLimit;

  // UserOp Hash
  const userOpHash = await ep.getUserOpHash(userOp);
  userOp.signature = await signer0.signMessage(hre.ethers.getBytes(userOpHash));

  // const owner = viemaccount.privateKeyToAccount("0x" + process.env.PRIVATE_KEY);
  // const signature = await permissionless.signUserOperationHashWithECDSA({
  //   account: owner,
  //   userOperation: userOp,
  //   chainId: fuseChain.id,
  //   entryPoint: ENTRYPOINT_ADDRESS,
  // });
  // userOp.signature = signature;

  console.log("userOp:", userOp);

  // Execute
  const userOpHashResult = await bundlerClient.sendUserOperation({
    userOperation: userOp,
    entryPoint: ENTRYPOINT_ADDRESS,
  });
  console.log("userOpHashResult:", userOpHashResult);

  const userOperationReceiptReceipt =
    await bundlerClient.getUserOperationReceipt({
      hash: userOpHashResult,
    });
  console.log("userOperationReceiptReceipt:", userOperationReceiptReceipt);

  const userOperationByHash = await bundlerClient.getUserOperationByHash({
    hash: userOpHashResult,
  });
  console.log("userOperationByHash:", userOperationByHash);

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHashResult,
  });

  console.log("receipt:", receipt);

  // const tx = await ep.handleOps([userOp], address0);
  // const receipt = await tx.wait();
  // console.log("receipt:", receipt);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
