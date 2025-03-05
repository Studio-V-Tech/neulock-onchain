import deployContracts from "./deploy-contracts-core";
import addSeries from "./add-series-core";

async function main() {
  const [neu, storage, metadata, logo, entitlement] = await deployContracts();

  await addSeries();

  console.log("Series added successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
