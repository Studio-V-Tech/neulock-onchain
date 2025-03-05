import { BaseContract, ContractTransactionResponse } from "ethers";

interface MetadataBaseContract extends BaseContract {
  // Metadata
  addSeries(name: Uint8Array, priceInGwei: bigint, firstToken: bigint, maxTokens: bigint, fgColorRGB565: bigint, bgColorRGB565: bigint, accentColorRGB565: bigint, makeAvailable: boolean): Promise<ContractTransactionResponse >;
  createTokenMetadata(seriesIndex: bigint, originalPrice: bigint): Promise<{ tokenId: bigint, governance: boolean }>;
  deleteTokenMetadata(tokenId: bigint): Promise<ContractTransactionResponse>;
  getAvailableSeries(): Promise<bigint[]>;
  getRefundAmount(tokenId: bigint): Promise<bigint>;
  getSeries(seriesIndex: bigint): Promise<{ name: `0x${string}`, priceInGwei: bigint, firstToken: bigint, maxTokens: bigint, mintedTokens: bigint, burntTokens: bigint, isAvailable: boolean, logoSvg: string }>;
  getSeriesMintingPrice(seriesIndex: bigint): Promise<bigint>;
  getTraitMetadataURI(): Promise<string>;
  getTraitValue(tokenId: bigint, traitKey: Uint8Array): Promise<`0x${string}`>;
  getTraitValues(tokenId: bigint, traitKeys: Uint8Array[]): Promise<`0x${string}`[]>;
  increaseSponsorPoints(tokenId: bigint, sponsorPointsIncrease: bigint): Promise<bigint>;
  isSeriesAvailable(seriesIndex: bigint): Promise<boolean>;
  setPriceInGwei(seriesIndex: bigint, price: bigint): Promise<ContractTransactionResponse>;
  setSeriesAvailability(seriesIndex: bigint, available: boolean): Promise<ContractTransactionResponse>;
  setTraitMetadataURI(uri: string): Promise<ContractTransactionResponse>;
  sumAllRefundableTokensValue(): Promise<bigint>;
  tokenURI(tokenId: bigint): Promise<string>;
  // AccessControl
  hasRole(role: `0x${string}`, account: `0x${string}`): Promise<boolean>;
  grantRole(role: `0x${string}`, account: `0x${string}`): Promise<ContractTransactionResponse>;
  revokeRole(role: `0x${string}`, account: `0x${string}`): Promise<ContractTransactionResponse>;
  getRoleAdmin(role: `0x${string}`): Promise<`0x${string}`>;
}

export default MetadataBaseContract;