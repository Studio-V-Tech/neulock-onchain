import addSeries from "./add-series-core";

async function main() {
  await addSeries();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
