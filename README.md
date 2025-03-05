# neulock-onchain
Neulock Web3 Password Manager smart contracts

## Test

npx hardhat test

## Usage

### Debug

#### Deployment

npx hardhat node
npx hardhat compile
npx hardhat run scripts/deploy-contracts.ts --network localhost

#### Add initial series
npx hardhat run scripts/add-series.ts --network localhost

#### Contract upgrade
CONTRACT=Neu|NeuStorage|NeuMetadata npx hardhat run scripts/upgrade.ts --network localhost

### Testing

#### Deployment

npx hardhat compile
npx hardhat run scripts/deploy-contracts.ts --network sepolia
npx hardhat verify --network sepolia 0xPROXY_ADDRESS

#### Contract upgrade
CONTRACT=Neu|NeuStorage|NeuMetadata npx hardhat run scripts/upgrade.ts --network sepolia

## Interactions

npx hardhat console --network [localhost | sepolia]
> const Neu = await ethers.getContractFactory("Neu");
> const neu = await Neu.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
> (await neu.balanceOf("0xdd2fd4581271e230360230f9337d5c0430bf44c0")).toString();
