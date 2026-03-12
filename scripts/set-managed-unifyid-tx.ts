import { getChain } from "./lib/utils";
import { ethers } from "hardhat";
import setManaged from "./set-managed-core";
import { ManagedContractDeployment, ChainContractAddress } from "./lib/config";

async function main() {
  const chain = await getChain(ethers.provider);
  const contractAddress = ChainContractAddress[chain][ManagedContractDeployment.unifyid] as `0x${string}`;
  await setManaged(contractAddress);
}

main();