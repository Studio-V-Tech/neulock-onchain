// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

import {INeuMetadataV1} from "./INeuMetadataV1.sol";

interface INeuMetadataV2 is INeuMetadataV1 {
    function isGovernanceToken(uint256 tokenId) external view returns (bool);
}