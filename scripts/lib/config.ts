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

export type SingletonContract =
  'NeuV3' |
  'NeuStorageV3' |
  'NeuMetadataV3' |
  'NeuLogoV2' |
  'NeuEntitlementV2' |
  'NeuDaoLockV2';

export type Contract = SingletonContract | 'NeuManagedAccountsV1';

export type ManagedContractDeployment =
  'unifyid' |
  'kinde';

export type ContractDeployment =
  SingletonContract |
  ManagedContractDeployment;

export type ChainType =
  'mainnet' |
  'testnet' |
  'local';

export type Account =
  'admin' |
  'operator' |
  'upgrader' |
  'sponsor';

export const ChainContractAddress: Record<Chain, Record<ContractDeployment, `0x${string}`>> = {
  [Chain.ethereum]: {
    ['NeuV3']: '0x0',
    ['NeuStorageV3']: '0x0',
    ['NeuMetadataV3']: '0x0',
    ['NeuLogoV2']: '0x0',
    ['NeuEntitlementV2']: '0x0',
    ['NeuDaoLockV2']: '0x0',
    ['unifyid']: '0x0',
    ['kinde']: '0x0',
  },
  [Chain.sepolia]: {
    ['NeuV3']: '0x51b063969a9b3E2C8e462BB0De6b7E742dd0d09F',
    ['NeuStorageV3']: '0xb023cF91D6015b13f785ABf7dF9Fd4e4Ff9FFFfF',
    ['NeuMetadataV3']: '0xb115C53A1ed35892a94ef126C81438404145e401',
    ['NeuLogoV2']: '0x0',
    ['NeuEntitlementV2']: '0x0',
    ['NeuDaoLockV2']: '0x0',
    ['unifyid']: '0x0',
    ['kinde']: '0x0',
  },
  [Chain.optimism]: {
    ['NeuV3']: '0x8D086dd57475D4490190fB15a19aAEc8167F89dD',
    ['NeuStorageV3']: '0xA7536b808f0937EEB42393a73095Fbf044A8e5aD',
    ['NeuMetadataV3']: '0x652bE7a9742b2cE265854133B5fA3b8E1fDD2510',
    ['NeuLogoV2']: '0x84DDa85AEed3E7EEC2AC5541626e1d717B5DBdA0',
    ['NeuEntitlementV2']: '0x844Ab2249724fbcda0e85e3559606e95664829B0',
    ['NeuDaoLockV2']: '0x05F1F98F2F5C2B679F8BC564925E5A1255845240',
    ['unifyid']: '0x0',
    ['kinde']: '0x0',
  },
  [Chain.optimismSepolia]: {
    ['NeuV3']: '0x60C16340c8be2635642A1f9387a3918E3196FdED',
    ['NeuStorageV3']: '0xa69e94763138cE2A041a0132fc0356EE857C47f2',
    ['NeuMetadataV3']: '0x5BA045319C390342c601A77fC705a0b29BcF9280',
    ['NeuLogoV2']: '0xc34D36ED7785cED5B72289ac96f86aD40FF8a2bc',
    ['NeuEntitlementV2']: '0xd44C62300124D5540812f37CA62F372600b6F2A2',
    ['NeuDaoLockV2']: '0xF17Ec62856f4516d72492010A168F6F40BD28e26',
    ['unifyid']: '0x3DA047988020F71DA83aF0C5976a7E2ff53F95af',
    ['kinde']: '0x8d6d41ee5738B10da2A883ff56EfD107C365eA72',
  },
  [Chain.arbitrumOne]: {
    ['NeuV3']: '0xf06A890a2Fdb0d21413FDc3488B7298552A9C0C9',
    ['NeuStorageV3']: '0xDcD7e74F4716990C4013fd50bEe1FbC54ccd2De0',
    ['NeuMetadataV3']: '0x5F37549475D42b158D354294e13422b1e8a43f01',
    ['NeuLogoV2']: '0x10d1767aB87e600c6a4085E65e1F078aeE94f7aD',
    ['NeuEntitlementV2']: '0xBDe5b957856B6c13718101a2b744Ce8b8aF248c0',
    ['NeuDaoLockV2']: '0x8f95a48AbD743FEeDfe0AD34028adbfE9C9E5D29',
    ['unifyid']: '0x0',
    ['kinde']: '0x0',
  },
  [Chain.arbitrumSepolia]: {
    ['NeuV3']: '0xbE2b0561145d55FfCf9867A3974C1f968845e557',
    ['NeuStorageV3']: '0x1093087372BB55b3012902AD29C634f45b9d81d7',
    ['NeuMetadataV3']: '0xBbe9A19D5ecE091Ac3ec9294d7eE7e36a25c0041',
    ['NeuLogoV2']: '0x4599Be512A45c7F6D849887aD1f94E83fD6B4d45',
    ['NeuEntitlementV2']: '0x2861E46f87BF4C2c1F09866ED343BA6Fa6FB3C30',
    ['NeuDaoLockV2']: '0x4f64BC2009B81AC8153F95B1c4ad469B56bFb221',
    ['unifyid']: '0x0',
    ['kinde']: '0x0',
  },
  [Chain.base]: {
    ['NeuV3']: '0xd0E66B652213fcbdCE609142B33498b7dcf05B50',
    ['NeuStorageV3']: '0x4D2a96E1421Dec3c9f0E083e7d805cB77124dFC1',
    ['NeuMetadataV3']: '0x10d1767aB87e600c6a4085E65e1F078aeE94f7aD',
    ['NeuLogoV2']: '0x91e173bF8051A945097348E57094Db7181495078',
    ['NeuEntitlementV2']: '0xB12A93858f84fd5908169EC6131DBE0aa838733c',
    ['NeuDaoLockV2']: '0x3416349d41BE951C7Ad3Feb75f0e2E93853f69f4',
    ['unifyid']: '0x0',
    ['kinde']: '0x0',
  },
  [Chain.baseSepolia]: {
    ['NeuV3']: '0x60C16340c8be2635642A1f9387a3918E3196FdED',
    ['NeuStorageV3']: '0x15E17C56D37555148Ea69286Fb64Da3e6B44b5a8',
    ['NeuMetadataV3']: '0x1dbE81875B823ebB282F661d2f377529Ff593C16',
    ['NeuLogoV2']: '0xA0fF27791E8cf3aBA3c93F210C9e0d0CA1159e0a',
    ['NeuEntitlementV2']: '0xF17Ec62856f4516d72492010A168F6F40BD28e26',
    ['NeuDaoLockV2']: '0xa69e94763138cE2A041a0132fc0356EE857C47f2',
    ['unifyid']: '0x0',
    ['kinde']: '0x0',
  },
  [Chain.hardhat]: {
    ['NeuV3']: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    ['NeuStorageV3']: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    ['NeuMetadataV3']: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    ['NeuLogoV2']: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    ['NeuEntitlementV2']: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    ['NeuDaoLockV2']: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    ['unifyid']: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    ['kinde']: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
  },
};

export const ChainTypeAccount: Record<ChainType, Record<Account, `0x${string}`>> = {
  ['mainnet']: {
    ['admin']: '0xf5459166F571f5dccD3c644cfCFa2c67D4bb0183',
    ['upgrader']: '0x2204be085d0Ee7860B2f811e2BAc8b520cBb4Ee8',
    ['operator']: '0x65854547542db7a4F23bf4b248B50263A7ea4a4D',
    ['sponsor']: '0xCa0aa7691BF697A8F2eCE516a77D0678150FB9a6',
  },
  ['testnet']: {
    ['admin']: '0x40DF403bE03cc2942e3C7FDE45F196772caF1130',
    ['upgrader']: '0x40DF403bE03cc2942e3C7FDE45F196772caF1130',
    ['operator']: '0x40DF403bE03cc2942e3C7FDE45F196772caF1130',
    ['sponsor']: '0xCa0aa7691BF697A8F2eCE516a77D0678150FB9a6',
  },
  ['local']: {
    ['admin']: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    ['upgrader']: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    ['operator']: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    ['sponsor']: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  },
};

export const mainnetChains: Chain[] = [
  Chain.ethereum,
  Chain.arbitrumOne,
  Chain.base,
  Chain.optimism,
] as const;

export const testnetChains: Chain[] = [
  Chain.sepolia,
  Chain.arbitrumSepolia,
  Chain.baseSepolia,
  Chain.optimismSepolia,
] as const;
