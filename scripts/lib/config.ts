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
  logo = 'NeuLogo',
  entitlement = 'NeuEntitlement',
  lock = 'NeuDaoLock',
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
    [Contract.logo]: '0x0',
    [Contract.entitlement]: '0x0',
    [Contract.lock]: '0x0',
  },
  [Chain.sepolia]: {
    [Contract.neu]: '0x51b063969a9b3E2C8e462BB0De6b7E742dd0d09F',
    [Contract.storage]: '0xb023cF91D6015b13f785ABf7dF9Fd4e4Ff9FFFfF',
    [Contract.metadata]: '0xb115C53A1ed35892a94ef126C81438404145e401',
    [Contract.logo]: '0x0',
    [Contract.entitlement]: '0x0',
    [Contract.lock]: '0x0',
  },
  [Chain.optimism]: {
    [Contract.neu]: '0x8D086dd57475D4490190fB15a19aAEc8167F89dD',
    [Contract.storage]: '0xA7536b808f0937EEB42393a73095Fbf044A8e5aD',
    [Contract.metadata]: '0x652bE7a9742b2cE265854133B5fA3b8E1fDD2510',
    [Contract.logo]: '0x84DDa85AEed3E7EEC2AC5541626e1d717B5DBdA0',
    [Contract.entitlement]: '0x844Ab2249724fbcda0e85e3559606e95664829B0',
    [Contract.lock]: '0x05F1F98F2F5C2B679F8BC564925E5A1255845240',
  },
  [Chain.optimismSepolia]: {
    [Contract.neu]: '0x60C16340c8be2635642A1f9387a3918E3196FdED',
    [Contract.storage]: '0xa69e94763138cE2A041a0132fc0356EE857C47f2',
    [Contract.metadata]: '0x5BA045319C390342c601A77fC705a0b29BcF9280',
    [Contract.logo]: '0xc34D36ED7785cED5B72289ac96f86aD40FF8a2bc',
    [Contract.entitlement]: '0xd44C62300124D5540812f37CA62F372600b6F2A2',
    [Contract.lock]: '0xF17Ec62856f4516d72492010A168F6F40BD28e26',
  },
  [Chain.arbitrumOne]: {
    [Contract.neu]: '0xf06A890a2Fdb0d21413FDc3488B7298552A9C0C9',
    [Contract.storage]: '0xDcD7e74F4716990C4013fd50bEe1FbC54ccd2De0',
    [Contract.metadata]: '0x5F37549475D42b158D354294e13422b1e8a43f01',
    [Contract.logo]: '0x10d1767aB87e600c6a4085E65e1F078aeE94f7aD',
    [Contract.entitlement]: '0xBDe5b957856B6c13718101a2b744Ce8b8aF248c0',
    [Contract.lock]: '0x8f95a48AbD743FEeDfe0AD34028adbfE9C9E5D29',
  },
  [Chain.arbitrumSepolia]: {
    [Contract.neu]: '0xbE2b0561145d55FfCf9867A3974C1f968845e557',
    [Contract.storage]: '0x1093087372BB55b3012902AD29C634f45b9d81d7',
    [Contract.metadata]: '0xBbe9A19D5ecE091Ac3ec9294d7eE7e36a25c0041',
    [Contract.logo]: '0x4599Be512A45c7F6D849887aD1f94E83fD6B4d45',
    [Contract.entitlement]: '0x2861E46f87BF4C2c1F09866ED343BA6Fa6FB3C30',
    [Contract.lock]: '0x4f64BC2009B81AC8153F95B1c4ad469B56bFb221',
  },
  [Chain.base]: {
    [Contract.neu]: '0xd0E66B652213fcbdCE609142B33498b7dcf05B50',
    [Contract.storage]: '0x4D2a96E1421Dec3c9f0E083e7d805cB77124dFC1',
    [Contract.metadata]: '0x10d1767aB87e600c6a4085E65e1F078aeE94f7aD',
    [Contract.logo]: '0x91e173bF8051A945097348E57094Db7181495078',
    [Contract.entitlement]: '0xB12A93858f84fd5908169EC6131DBE0aa838733c',
    [Contract.lock]: '0x3416349d41BE951C7Ad3Feb75f0e2E93853f69f4',
  },
  [Chain.baseSepolia]: {
    [Contract.neu]: '0x60C16340c8be2635642A1f9387a3918E3196FdED',
    [Contract.storage]: '0x15E17C56D37555148Ea69286Fb64Da3e6B44b5a8',
    [Contract.metadata]: '0x1dbE81875B823ebB282F661d2f377529Ff593C16',
    [Contract.logo]: '0xA0fF27791E8cf3aBA3c93F210C9e0d0CA1159e0a',
    [Contract.entitlement]: '0xF17Ec62856f4516d72492010A168F6F40BD28e26',
    [Contract.lock]: '0xa69e94763138cE2A041a0132fc0356EE857C47f2',
  },
  [Chain.hardhat]: {
    [Contract.neu]: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    [Contract.storage]: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    [Contract.metadata]: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    [Contract.logo]: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    [Contract.entitlement]: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    [Contract.lock]: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
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