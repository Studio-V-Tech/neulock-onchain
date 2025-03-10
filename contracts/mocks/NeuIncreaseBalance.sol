// SPDX-License-Identifier: CC0-1.0
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {NeuV2} from "../current/NeuV2.sol";

contract NeuIncreaseBalance is NeuV2 {
    function increaseBalance(address account, uint128 value) external {
        _increaseBalance(account, value);
    }
}