require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "fuse",
  networks: {
    arbitrum: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    fuse: {
      url: process.env.RPC_URL_FUSE_SPOT,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
};
