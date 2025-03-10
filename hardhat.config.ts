import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-contract-sizer';
import "hardhat-interface-generator";
import '@unlock-protocol/hardhat-plugin';

const NEULOCK_DEPLOYER_PRIVATE_KEY = vars.get("NEULOCK_DEPLOYER_PRIVATE_KEY");
const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");
const INFURA_API_KEY = vars.get("INFURA_API_KEY");
const COINMARKETCAP_API_KEY = vars.get("COINMARKETCAP_API_KEY");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const ETHERSCAN_OP_API_KEY = vars.get("ETHERSCAN_OP_API_KEY");
const ARBISCAN_API_KEY = vars.get("ARBISCAN_API_KEY");
const BASESCAN_API_KEY = vars.get("BASESCAN_API_KEY");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000,
      },
    },
  },
  networks: {
    ethereum: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [NEULOCK_DEPLOYER_PRIVATE_KEY],
    },
    arbitrumOne: {
      url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [NEULOCK_DEPLOYER_PRIVATE_KEY],
    },
    base: {
      url: `https://base-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [NEULOCK_DEPLOYER_PRIVATE_KEY],
    },
    optimism: {
      url: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [NEULOCK_DEPLOYER_PRIVATE_KEY],
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    arbitrumSepolia: {
      url: `https://arbitrum-sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    baseSepolia: {
      url: `https://base-sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    optimismSepolia: {
      url: `https://optimism-sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      ethereum: ETHERSCAN_API_KEY,
      arbitrumOne: ARBISCAN_API_KEY,
      base: BASESCAN_API_KEY,
      optimisticEthereum: ETHERSCAN_OP_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      arbitrumSepolia: ARBISCAN_API_KEY,
      baseSepolia: ETHERSCAN_API_KEY,
      optimismSepolia: ETHERSCAN_API_KEY,
    },
  },
  contractSizer: {
    runOnCompile: true,
    strict: true,
  },
  gasReporter: {
    enabled: !!process.env.ENABLE_GAS_REPORTER,
    coinmarketcap: COINMARKETCAP_API_KEY,
    gasPriceApi: ETHERSCAN_API_KEY,
  },
};

export default config;
