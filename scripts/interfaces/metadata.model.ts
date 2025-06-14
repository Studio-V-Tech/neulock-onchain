import { BaseContract, ContractTransactionResponse } from "ethers";

import AccessControl from "./lib/access-control.model";
import UUPSUpgradeable from "./lib/uups-upgradeable.model";

interface MetadataBaseContract extends BaseContract, AccessControl, UUPSUpgradeable {
  addSeries(name: Uint8Array, priceInGwei: bigint, firstToken: bigint, maxTokens: bigint, fgColorRGB565: bigint, bgColorRGB565: bigint, accentColorRGB565: bigint, makeAvailable: boolean): Promise<ContractTransactionResponse>;
  createTokenMetadata(seriesIndex: bigint, originalPrice: bigint): Promise<{ tokenId: bigint, governance: boolean }>;
  deleteTokenMetadata(tokenId: bigint): Promise<ContractTransactionResponse>;
  getAvailableSeries(): Promise<bigint[]>;
  getRefundAmount(tokenId: bigint): Promise<bigint>;
  getSeries(seriesIndex: bigint): Promise<{ name: `0x${string}`, priceInGwei: bigint, firstToken: bigint, maxTokens: bigint, mintedTokens: bigint, burntTokens: bigint, isAvailable: boolean, logoSvg: string }>;
  getSeriesMintingPrice(seriesIndex: bigint): Promise<bigint>;
  getTraitMetadataURI(): Promise<string>;
  getTraitValue(tokenId: bigint, traitKey: `0x${string}`): Promise<`0x${string}`>;
  getTraitValues(tokenId: bigint, traitKeys: `0x${string}`[]): Promise<`0x${string}`[]>;
  increaseSponsorPoints(tokenId: bigint, sponsorPointsIncrease: bigint): Promise<bigint>;
  isSeriesAvailable(seriesIndex: bigint): Promise<boolean>;
  setPriceInGwei(seriesIndex: bigint, price: bigint): Promise<ContractTransactionResponse>;
  setSeriesAvailability(seriesIndex: bigint, available: boolean): Promise<ContractTransactionResponse>;
  setTraitMetadataURI(uri: string): Promise<ContractTransactionResponse>;
  sumAllRefundableTokensValue(): Promise<bigint>;
  tokenURI(tokenId: bigint): Promise<string>;
  setLogoContract(logoContract: `0x${string}`): Promise<ContractTransactionResponse>;
  initializeV3(): Promise<ContractTransactionResponse>;
}

export default MetadataBaseContract;