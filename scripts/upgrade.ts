import { ethers, upgrades } from "hardhat";
import { ChainContractAddress, ContractDeployment } from './lib/config';
import { getChain } from "./lib/utils";

const contracts: ContractDeployment[] = [
  "NeuV3",
  "NeuStorageV3",
  "NeuMetadataV3",
  "NeuLogoV2",
  "NeuEntitlementV2",
  "NeuDaoLockV2",
];

async function main() {
  if (!process.env.CONTRACT || !contracts.includes(process.env.CONTRACT as ContractDeployment)) {
    console.error(`CONTRACT must be one of ${contracts.join(", ")}`);
    process.exit(1);
  }

  const contractName = process.env.CONTRACT as ContractDeployment;
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