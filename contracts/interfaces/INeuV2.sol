// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

import {INeuV1} from "./INeuV1.sol";

interface INeuV2 is INeuV1 {
    function setDaoLockContract(address payable newDaoLockContract) external;
    function isGovernanceToken(uint256 tokenId) external view returns (bool);
}