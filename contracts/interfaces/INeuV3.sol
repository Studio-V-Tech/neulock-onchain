// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

import {INeuV2} from "./INeuV2.sol";

interface INeuV3 is INeuV2 {
    event InitializedNeuV3(address indexed royaltyReceiver);
    event RoyaltyReceiverUpdated(address indexed royaltyReceiver);

    function setRoyaltyReceiver(address royaltyReceiver) external;
    function entitlementAfterTimestamps(uint256 tokenId) external view returns (uint256);
}

interface INeuTokenV3 is INeuV3, IERC721Enumerable {}