// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

interface INeuManagedAccountsV1 {
    event AccountAdded(address indexed account);
    event AccountRemoved(address indexed account);

    function add(address account) external;
    function remove(address account) external;
    function balanceOf(address account) external view returns (uint256);
}
