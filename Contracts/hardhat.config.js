require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks : {
    mumbai : {
      url : process.env.RPC_URL,
      accounts : [process.env.PRIVATE_KEY]
    }
  },

  etherscan : {
    apiKey : {
      polygonMumbai : process.env.POLYGONSCAN_API
    }
  }
};
