import { ethers } from "hardhat";
import { ChainTypeAccount, ChainContractAddress } from "./lib/config";
import { getChain, getChainType } from "./lib/utils";
import EntitlementBaseContract from "./interfaces/entitlement-v2.model";

async function deployManagedContracts({ forceOperations } : {
  forceOperations?: boolean,
} = {}
): Promise<void> {
  const chain = await getChain(ethers.provider);
  const chainType = await getChainType(chain);

  const operatorAddress = ChainTypeAccount[chainType].operator;
  const sponsorAddress = ChainTypeAccount[chainType].sponsor;

  const Entitlement = await ethers.getContractFactory("NeuEntitlementV2");
  const Managed = await ethers.getContractFactory("NeuManagedAccountsV1");

  const operatorSigner = forceOperations || chainType === "local" ? await ethers.getSigner(operatorAddress) : null;

  console.log('---');

  const managedUnifyid = await Managed.deploy(
    sponsorAddress,
  );

  await managedUnifyid.waitForDeployment();

  const managedUnifyidAddress = await managedUnifyid.getAddress();
  console.log(`Neulock ManagedUnifyid deployed at: ${managedUnifyidAddress}`);

  const managedKinde = await Managed.deploy(
    sponsorAddress,
  );

  await managedKinde.waitForDeployment();

  const managedKindeAddress = await managedKinde.getAddress();
  console.log(`Neulock ManagedKinde deployed at:   ${managedKindeAddress}`);

  console.log('---');

  if (operatorSigner) {
    const entitlement = await ethers.getContractAt("NeuEntitlementV2", ChainContractAddress[chain]["NeuEntitlementV2"]);
    const entitlementRunner = entitlement.connect(operatorSigner) as EntitlementBaseContract;

    await (await entitlementRunner.addEntitlementContract(managedUnifyidAddress as `0x${string}`)).wait();
    console.log('Added Managed UnifyID as an entitlement contract');

    await (await entitlementRunner.addEntitlementContract(managedKindeAddress as `0x${string}`)).wait();
    console.log('Added Managed Kinde as an entitlement contract');
  }

  console.log('---');
}

export default deployManagedContracts;