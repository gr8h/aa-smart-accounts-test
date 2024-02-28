const hre = require("hardhat");

const upjs = require("userop");
const viem = require("viem");
require("dotenv").config();

const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const PAYMASTER_ADDRESS = "0xB38f8155AD5439F68A5fBd3933Ec75AB9f6143aC";
const SIMPLE_ACCOUNT_FACTORY_ADDRESS =
  "0x9406Cc6185a346906296840746125a0E44976454";

async function main() {
  const [signer0] = await hre.ethers.getSigners();
  const address0 = await signer0.getAddress();
  console.log("address0:", address0);

  const rpcUrl = process.env.RPC_URL_FUSE_SPOT; // https://fuse-bundler.etherspot.io/

  var builder = await upjs.Presets.Builder.Kernel.init(signer0, rpcUrl);

  const SimpleAccountABI = [
    {
      inputs: [
        {
          internalType: "contract IEntryPoint",
          name: "_entryPoint",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "accountImplementation",
      outputs: [
        {
          internalType: "contract SimpleAccount",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "salt",
          type: "uint256",
        },
      ],
      name: "createAccount",
      outputs: [
        {
          internalType: "contract SimpleAccount",
          name: "ret",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "salt",
          type: "uint256",
        },
      ],
      name: "getAddress",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const accountFactory = await hre.ethers.getContractAt(
    SimpleAccountABI,
    SIMPLE_ACCOUNT_FACTORY_ADDRESS
  );

  let initCode =
    SIMPLE_ACCOUNT_FACTORY_ADDRESS +
    accountFactory.interface
      .encodeFunctionData("createAccount", [address0, 0n])
      .slice(2);

  // const senderAddress = hre.ethers.getCreate2Address(
  //   address0,
  //   hre.ethers.id("HelloWorld"),
  //   hre.ethers.keccak256(initCode)
  // );
  // console.log("senderAddress:", senderAddress);

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

  // Is initCode deployed?
  const code = await hre.ethers.provider.getCode(senderAddress);
  if (code !== "0x") {
    initCode = "0x";
  }
  console.log("Generated initCode:", initCode);

  // UserOperation
  builder.setCallData(callData);
  builder.setSender(address0);
  builder.setPaymasterAndData(PAYMASTER_ADDRESS);

  let userOp = await builder.buildOp(ENTRYPOINT_ADDRESS, 122);

  console.log("userOp:", userOp);

  // Execute
  const client = await upjs.Client.init(rpcUrl);
  const response = await client.sendUserOperation(builder);
  const userOperationEvent = await response.wait();
  console.log("userOperationEvent:", userOperationEvent);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
