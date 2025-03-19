import deployContracts from "./deploy-contracts-core";

async function main() {
  await deployContracts({ forceOperations: true });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});