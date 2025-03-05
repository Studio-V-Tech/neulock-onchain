import { ethers } from 'hardhat';
import { generateTx } from "./generate-tx-core";
import { Contract, Chain, ChainContractAddress } from "./lib/config";
import traitMetadataUri from './trait-metadata-uri';

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const chain = chainId.toString() as Chain;

  switch (process.env.STEP) {
    case '1':
      await setMetadataContract(chain);
      break;
    case '2':
      await setStorageContract(chain);
      break;
    case '3':
      await setTraitMetadataURI(chain);
      break;
    default:
      console.error('ERROR: Set env variable STEP to one of the following: 1, 2, 3');
      process.exit(1);
  }
}

async function setMetadataContract(chain: Chain) {
  await generateTx({
    contract: Contract.neu,
    functionName: 'setMetadataContract',
    funcArgs: [
      ChainContractAddress[chain][Contract.metadata],
    ],
  });
}

async function setStorageContract(chain: Chain) {
  await generateTx({
    contract: Contract.neu,
    functionName: 'setStorageContract',
    funcArgs: [
      ChainContractAddress[chain][Contract.storage],
    ],
  });
}

async function setTraitMetadataURI(chain: Chain) {
  await generateTx({
    contract: Contract.neu,
    functionName: 'setTraitMetadataURI',
    funcArgs: [
      traitMetadataUri,
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});