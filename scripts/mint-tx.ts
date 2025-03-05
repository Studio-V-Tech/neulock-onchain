import { generateTx } from "./generate-tx-core";
import { Contract } from "./lib/config";

async function main() {
  let seriesIndex: number;

  if (!process.env.TO || !process.env.TO.startsWith('0x')) {
    console.error('ERROR: Set env variable TO to the address of the recipient.');
    process.exit(1);
  }

  try {
    seriesIndex = parseInt(process.env.SERIES!);
  } catch (error) {
    console.error('ERROR: Set env variable SERIES to an integer representing the index of the series to mint');
    process.exit(1);
  }

  let count = 1;
  try {
    const c = parseInt(process.env.COUNT!);
    if (Number.isInteger(c) && c > 0) {
      count = c;
    }
  } catch (error) {}

  await generateTx({
    contract: Contract.neu,
    functionName: 'safeMint',
    funcArgs: [process.env.TO!, BigInt(seriesIndex)],
    count,
  });
}

main();