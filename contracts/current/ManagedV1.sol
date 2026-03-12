// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NeuManagedAccountsV1 is Ownable {
    event AccountAdded(address indexed account);
    event AccountRemoved(address indexed account);

    mapping(address => uint256) private _whitelist;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function add(address account) external onlyOwner {
        _whitelist[account] = 1;
        emit AccountAdded(account);
    }

    function remove(address account) external onlyOwner {
        delete _whitelist[account];
        emit AccountRemoved(account);
    }

    function balanceOf(address account) external view returns (uint256) {
        return _whitelist[account];
    }
}