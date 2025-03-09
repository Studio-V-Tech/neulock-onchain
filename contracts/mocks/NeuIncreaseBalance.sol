// SPDX-License-Identifier: CC0-1.0
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {Neu} from "../NeuV1.sol";

contract NeuIncreaseBalance is Neu {
    function increaseBalance(address account, uint128 value) external {
        _increaseBalance(account, value);
    }
}