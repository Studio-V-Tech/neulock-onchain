import { ethers } from 'hardhat';
import { generateTx } from "./generate-tx-core";
import { Chain, ChainContractAddress, Contract } from "./lib/config";
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
    case '4':
      await addUnifyidManagedContract(chain);
      break;
    case '5':
      await addKindeManagedContract(chain);
      break;
    default:
      console.error('ERROR: Set env variable STEP to one of the following: 1, 2, 3, 4, 5');
      process.exit(1);
  }
}

async function setMetadataContract(chain: Chain) {
  await generateTx({
    contract: "NeuV3" satisfies Contract,
    functionName: 'setMetadataContract',
    funcArgs: [
      ChainContractAddress[chain]["NeuMetadataV3"],
    ],
  });
}

async function setStorageContract(chain: Chain) {
  await generateTx({
    contract: "NeuV3" satisfies Contract,
    functionName: 'setStorageContract',
    funcArgs: [
      ChainContractAddress[chain]["NeuStorageV3"],
    ],
  });
}

async function setTraitMetadataURI(chain: Chain) {
  await generateTx({
    contract: "NeuV3" satisfies Contract,
    functionName: 'setTraitMetadataURI',
    funcArgs: [
      traitMetadataUri,
    ],
  });
}

async function addUnifyidManagedContract(chain: Chain) {
  await generateTx({
    contract: "NeuEntitlementV2" satisfies Contract,
    functionName: 'addEntitlementContract',
    funcArgs: [
      ChainContractAddress[chain]["unifyid"],
    ],
  });
}

async function addKindeManagedContract(chain: Chain) {
  await generateTx({
    contract: "NeuEntitlementV2" satisfies Contract,
    functionName: 'addEntitlementContract',
    funcArgs: [
      ChainContractAddress[chain]["kinde"],
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});