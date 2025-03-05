import { ethers, upgrades } from "hardhat";
import { Contract, ChainContractAddress } from './lib/config';
import { getChain } from "./lib/utils";

async function main() {
  if (!process.env.CONTRACT || Object.values(Contract).indexOf(process.env.CONTRACT! as Contract) === -1) {
    console.error(`CONTRACT must be one of ${Object.values(Contract).join(", ")}`);
    process.exit(1);
  }

  const contractName = process.env.CONTRACT! as Contract;
  const chain = await getChain(ethers.provider);
  const contractAddress = ChainContractAddress[chain][contractName];
  const contractFactory = await ethers.getContractFactory(contractName);

  await upgrades.upgradeProxy(contractAddress, contractFactory);

  console.log(`Contract ${contractName} upgraded at ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});