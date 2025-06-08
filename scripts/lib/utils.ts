import { ethers } from "hardhat";
import { expect } from "chai";
import { randomBytesSeed } from '@csquare/random-bytes-seed';
import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { Chain, ChainType } from "./config";

export interface TokenMetadata {
  description: string;
  name: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
    display_type?: string;
  }[];
}

export const day = 86400;

export const pointsTrait = keccak256("points");

export const userDataBytesArray = [
  randomBytesSeed(16, '0'),
  randomBytesSeed(32, '1'),
  randomBytesSeed(64, '2'),
  randomBytesSeed(128, '3'),
  randomBytesSeed(256, '4'),
  randomBytesSeed(512, '5'),
];

export const userDataHexArray = userDataBytesArray.map((bytes) => `0x${Buffer.from(bytes).toString('hex')}`);

export function stringToBytes(str: string, bytesLength = 8): Uint8Array {
  return new Uint8Array(Array.from(new TextEncoder().encode(str))
    .concat(Array.from(new Uint8Array(bytesLength - str.length)))
  );
}

export function bytesToString(bytesHex: `0x${string}`): string {
  const bytes = Uint8Array.from(Buffer.from(bytesHex.substring(2), 'hex'));
  return new TextDecoder().decode(bytes).replace(/\0/g, '');
}

export function stringToHex(str: string): `0x${string}` {
  const bytes = stringToBytes(str);
  return `0x${Buffer.from(bytes).toString('hex')}`;
}

export function stringToHex32Bytes(str: string): `0x${string}` {
  const bytes = stringToBytes(str, 32);
  return `0x${Buffer.from(bytes).toString('hex')}`;
}

export function seriesValue(series: { priceInGwei: bigint }): bigint {
  return series.priceInGwei.valueOf() * (10n ** 9n);
}

export function keccak256(str: string): `0x${string}` {
  return ethers.keccak256(ethers.toUtf8Bytes(str)) as `0x${string}`;
}

export function getRoles(): { adminRole: `0x${string}`, upgraderRole: `0x${string}`, operatorRole: `0x${string}` } {
  return {
    adminRole: '0x0000000000000000000000000000000000000000000000000000000000000000',
    upgraderRole: keccak256("UPGRADER_ROLE"),
    operatorRole: keccak256("OPERATOR_ROLE"),
  };
}

export function validateTokenMetadataCommonAttributes(tokenMetadata: TokenMetadata) {
      expect(tokenMetadata.description).to.equal("Neulock Password Manager membership NFT - neulock.app");
      expect(tokenMetadata.image).to.satisfy((id: string) => id.startsWith("data:image/svg+xml;base64,"));
      expect(tokenMetadata.attributes).to.have.lengthOf(4);
      expect(tokenMetadata.attributes[0].trait_type).to.equal("Series");
      expect(tokenMetadata.attributes[1].trait_type).to.equal("Governance Access");
      expect(tokenMetadata.attributes[2].trait_type).to.equal("Series Max Supply");
      expect(tokenMetadata.attributes[3].trait_type).to.equal("Mint Date");
      expect(tokenMetadata.attributes[3].display_type).to.equal("date");
      expect(tokenMetadata.attributes[3].value).to.be.greaterThan(1720000000);
}

export function parseSponsorPointsResponse(traitBytes: `0x${string}`): number {
  return parseInt(traitBytes.substring(2), 16);
}

export function validateSvg(svg: string) {
  expect(svg).to.satisfy((svg: string) => svg.startsWith("<svg"));
  expect(svg).to.satisfy((svg: string) => svg.endsWith("</svg>"));
}

export async function getChain(provider: HardhatEthersProvider): Promise<Chain> {
  const chainId = (await provider.getNetwork()).chainId;
  return chainId.toString() as Chain;
}

export async function getChainType(chain: Chain): Promise<ChainType> {
  const isMainnet = [
    Chain.ethereum,
    Chain.arbitrumOne,
    Chain.base,
    Chain.optimism,
  ].includes(chain);

  const isTestnet = [
    Chain.sepolia,
    Chain.arbitrumSepolia,
    Chain.baseSepolia,
    Chain.optimismSepolia,
  ].includes(chain);

  return isMainnet ? ChainType.mainnet : isTestnet ? ChainType.testnet : ChainType.local;
}