import { BaseContract, ContractTransactionResponse } from "ethers";

import AccessControl from "./lib/access-control.model";
import UUPSUpgradeable from "./lib/uups-upgradeable.model";
import ERC721Enumerable from "./lib/erc721-enumerable.model";

interface NeuBaseContract extends BaseContract, AccessControl, UUPSUpgradeable, ERC721Enumerable {
  initializeV2(lockContract: `0x${string}`): Promise<ContractTransactionResponse>;
  initializeV3(royaltyReceiver: `0x${string}`): Promise<ContractTransactionResponse>;
  ownerOf(token: bigint): Promise<`0x${string}`>;
  totalSupply(): Promise<bigint>;
  balanceOf(account: `0x${string}`): Promise<bigint>;
  safeMint(to: string, seriesIndex: bigint): Promise<ContractTransactionResponse>;
  safeMintPublic(seriesIndex: bigint, options: { value: bigint }): Promise<ContractTransactionResponse>;
  setSeriesAvailability(seriesIndex: bigint, available: boolean): Promise<ContractTransactionResponse>;
  addSeries(name: Uint8Array, priceInGwei: bigint, firstToken: bigint, maxTokens: bigint, fgColorRGB565: bigint, bgColorRGB565: bigint, makeAvailable: boolean): Promise<ContractTransactionResponse >;
  setPriceInGwei(seriesIndex: bigint, price: bigint): Promise<ContractTransactionResponse>;
  getSeries(seriesIndex: bigint): Promise<{ name: `0x${string}`, priceInGwei: bigint, firstToken: bigint, maxTokens: bigint, mintedTokens: bigint, isAvailable: boolean }>;
  getAvailableSeries(): Promise<bigint[]>;
  withdraw(): Promise<ContractTransactionResponse>;
  refund(tokenId: bigint): Promise<ContractTransactionResponse>;
  royaltyInfo(tokenId: bigint, value: bigint): Promise<[ `0x${string}`, bigint ]>;
  getTraitMetadataURI(): Promise<string>;
  getTraitValue(tokenId: bigint, traitKey: Uint8Array): Promise<`0x${string}`>;
  getTraitValues(tokenId: bigint, traitKeys: Uint8Array[]): Promise<`0x${string}`[]>;
  setTraitMetadataURI(uri: string): Promise<ContractTransactionResponse>;
  setTrait(tokenId: bigint, traitKey: Uint8Array, value: Uint8Array): Promise<ContractTransactionResponse>;
  increaseSponsorPoints(tokenId: bigint): Promise<{ newSponsorPoints: bigint, sponsorPointsIncrease: bigint }>;
  weiPerSponsorPoint(): Promise<bigint>;
  setWeiPerSponsorPoint(newWeiPerSponsorPoint: bigint): Promise<ContractTransactionResponse>;
  setMetadataContract(metadataContract: `0x${string}`): Promise<ContractTransactionResponse>;
  setStorageContract(storageContract: `0x${string}`): Promise<ContractTransactionResponse>;
  tokenURI(tokenId: bigint): Promise<string>;
  getTokensOfOwner(owner: `0x${string}`): Promise<bigint[]>;
  getTokensWithData(tokenIds: bigint[]): Promise<{ tokenUris: string[], isUserMinted: boolean[] }>;
  getTokensTraitValues(tokenIds: bigint[], traitKeys: Uint8Array[]): Promise<`0x${string}`[][]>;
  burn(tokenId: bigint): Promise<ContractTransactionResponse>;
  setDaoLockContract(newDaoLockContract: `0x${string}`): Promise<ContractTransactionResponse>;
  isGovernanceToken(tokenId: bigint): Promise<boolean>;
  setRoyaltyReceiver(royaltyReceiver: `0x${string}`): Promise<ContractTransactionResponse>;
  entitlementAfterTimestamps(tokenId: bigint): Promise<bigint>;
}

export default NeuBaseContract;