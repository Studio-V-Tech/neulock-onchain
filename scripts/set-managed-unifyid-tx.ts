import { getChain } from "./lib/utils";
import { ethers } from "hardhat";
import setManaged from "./set-managed-core";
import { ChainContractAddress } from "./lib/config";

async function main() {
  const chain = await getChain(ethers.provider);
  const contractAddress = ChainContractAddress[chain].unifyid;
  await setManaged(contractAddress);
}

main();