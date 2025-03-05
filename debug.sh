#!/bin/bash
set -m

npx hardhat node & sleep 3 && npx hardhat run scripts/deploy-debug.ts --network localhost && fg 1
