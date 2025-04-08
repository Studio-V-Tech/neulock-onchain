import { generateTx } from "./generate-tx-core";
import { Contract } from "./lib/config";

async function main() {
  if (!process.env.CONTRACT || !process.env.CONTRACT.startsWith('0x')) {
    console.error('ERROR: Set env variable CONTRACT to the address of the new entitlement contract.');
    process.exit(1);
  }

  await generateTx({
    contract: Contract.entitlement,
    functionName: 'addEntitlementContract',
    funcArgs: [process.env.CONTRACT!],
  });
}

main();