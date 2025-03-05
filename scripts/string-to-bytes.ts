import { stringToHex } from "./lib/utils";

function main() {
  console.log(stringToHex(process.env.STRING!));
}

main();