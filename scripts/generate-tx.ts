import { generateTx } from './generate-tx-core';
import { Contract } from './lib/config';

async function main() {
  if (!process.env.CONTRACT || !(<any>Object).values(Contract).includes(process.env.CONTRACT)) {
    console.error('ERROR: Set env variable CONTRACT to one of the following: ', (<any>Object).values(Contract).join(', '));
    process.exit(1);
  }

  if (!process.env.FUNCTION) {
    console.error('ERROR: Set env variable FUNCTION to the function name.');
    process.exit(1);
  }

  const functionName = process.env.FUNCTION!;

  let funcArgs: any[];

  try {
    funcArgs = !process.env.ARGUMENTS ? [] : JSON.parse(process.env.ARGUMENTS!);
    if (!Array.isArray(funcArgs)) {
      throw new Error();
    }
  } catch (error) {
    console.error('ERROR: Set env variable ARGUMENTS to a JSON array of arguments.');
    process.exit(1);
  }

  let value: bigint | null = null;

  if (process.env.VALUE) {
    try {
      value = BigInt(process.env.VALUE);
    } catch (error) {
      console.error('ERROR: Set env variable VALUE to an integer representing the amount of wei to send.');
      process.exit(1);
    }
  }

  const contractAddressOverride = process.env.CONTRACT_ADDRESS || null;

  const contractName = process.env.CONTRACT!

  await generateTx({
    contract: contractName as Contract,
    functionName,
    funcArgs,
    value,
    contractAddressOverride,
});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
