export enum Chain {
  ethereum = '1',
  sepolia = '11155111',
  optimism = '10',
  optimismSepolia = '11155420',
  arbitrumOne = '42161',
  arbitrumSepolia = '421614',
  base = '8453',
  baseSepolia = '84532',
  hardhat = '31337',
}

export enum Contract {
  neu = 'Neu',
  storage = 'NeuStorage',
  metadata = 'NeuMetadata',
}

export enum ChainType {
  mainnet = 'mainnet',
  testnet = 'testnet',
  local = 'local',
}

export enum Account {
  admin = 'admin',
  operator = 'operator',
  upgrader = 'upgrader',
}

export const ChainContractAddress = {
  [Chain.ethereum]: {
    [Contract.neu]: '0x0',
    [Contract.storage]: '0x0',
    [Contract.metadata]: '0x0',
  },
  [Chain.sepolia]: {
    [Contract.neu]: '0x51b063969a9b3E2C8e462BB0De6b7E742dd0d09F',
    [Contract.storage]: '0xb023cF91D6015b13f785ABf7dF9Fd4e4Ff9FFFfF',
    [Contract.metadata]: '0xb115C53A1ed35892a94ef126C81438404145e401',
  },
  [Chain.optimism]: {
    [Contract.neu]: '0x8D086dd57475D4490190fB15a19aAEc8167F89dD',
    [Contract.storage]: '0xA7536b808f0937EEB42393a73095Fbf044A8e5aD',
    [Contract.metadata]: '0x652bE7a9742b2cE265854133B5fA3b8E1fDD2510',
  },
  [Chain.optimismSepolia]: {
    [Contract.neu]: '0xf214d301656fE8d8B1C20405D80EBA88B1E464da',
    [Contract.storage]: '0x68CB233b12AC5026f45FE741d0a32382c4B86794',
    [Contract.metadata]: '0xb380c79BFfeeCEA9693d94837d18993EF82c0489',
  },
  [Chain.arbitrumOne]: {
    [Contract.neu]: '0xf06A890a2Fdb0d21413FDc3488B7298552A9C0C9',
    [Contract.storage]: '0xDcD7e74F4716990C4013fd50bEe1FbC54ccd2De0',
    [Contract.metadata]: '0x5F37549475D42b158D354294e13422b1e8a43f01',
  },
  [Chain.arbitrumSepolia]: {
    [Contract.neu]: '0xf214d301656fE8d8B1C20405D80EBA88B1E464da',
    [Contract.storage]: '0x68CB233b12AC5026f45FE741d0a32382c4B86794',
    [Contract.metadata]: '0xb380c79BFfeeCEA9693d94837d18993EF82c0489',
  },
  [Chain.base]: {
    [Contract.neu]: '0xd0E66B652213fcbdCE609142B33498b7dcf05B50',
    [Contract.storage]: '0x4D2a96E1421Dec3c9f0E083e7d805cB77124dFC1',
    [Contract.metadata]: '0x10d1767aB87e600c6a4085E65e1F078aeE94f7aD',
  },
  [Chain.baseSepolia]: {
    [Contract.neu]: '0xf214d301656fE8d8B1C20405D80EBA88B1E464da',
    [Contract.storage]: '0x68CB233b12AC5026f45FE741d0a32382c4B86794',
    [Contract.metadata]: '0xb380c79BFfeeCEA9693d94837d18993EF82c0489',
  },
  [Chain.hardhat]: {
    [Contract.neu]: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    [Contract.storage]: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    [Contract.metadata]: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  },
};

export const ChainTypeAccount = {
  [ChainType.mainnet]: {
    [Account.admin]: '0xf5459166F571f5dccD3c644cfCFa2c67D4bb0183',
    [Account.upgrader]: '0x2204be085d0Ee7860B2f811e2BAc8b520cBb4Ee8',
    [Account.operator]: '0x65854547542db7a4F23bf4b248B50263A7ea4a4D',
  },
  [ChainType.testnet]: {
    [Account.admin]: '0x40DF403bE03cc2942e3C7FDE45F196772caF1130',
    [Account.upgrader]: '0x40DF403bE03cc2942e3C7FDE45F196772caF1130',
    [Account.operator]: '0x40DF403bE03cc2942e3C7FDE45F196772caF1130',
  },
  [ChainType.local]: {
    [Account.admin]: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    [Account.upgrader]: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    [Account.operator]: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  },
};