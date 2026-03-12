import { generateTx } from "./generate-tx-core";

import { Contract } from './lib/config';

export default async function setManaged(managedContract: `0x${string}`) {
  return await generateTx({
    contract: Contract.entitlement,
    functionName: 'addEntitlementContract',
    funcArgs: [managedContract],
  });
}
