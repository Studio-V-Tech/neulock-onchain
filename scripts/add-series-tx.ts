import { generateTx } from "./generate-tx-core";
import { stringToBytes } from "./lib/utils";
import { Contract } from "./lib/config";

async function main() {
  const series = [
    [
      stringToBytes('OG'),
      10n ** 9n,
      1n,
      9n,
      65535n,
      0n,
      0n,
      true,
    ],
    [
      stringToBytes('WAGMI1'),
      1337n * 10n ** 5n,
      1000n,
      30n,
      58328n,
      6279n,
      65153n,
      true,
    ]
  ];

  let seriesIndex: number;

  try {
    seriesIndex = parseInt(process.env.SERIES!);
    if (seriesIndex < 0 || seriesIndex >= series.length) {
      throw new Error();
    }
  } catch (error) {
    console.error('ERROR: Set env variable SERIES to an integer representing the index of the series to add, from 0 to .' + (series.length - 1));
    process.exit(1);
  }

  await generateTx({
    contract: Contract.metadata,
    functionName: 'addSeries',
    funcArgs: series[seriesIndex],
  });
}

main();