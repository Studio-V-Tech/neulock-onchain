// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {INeuDaoLockV1} from "../interfaces/ILockV1.sol";
import {INeuV3, INeuTokenV3} from "../interfaces/INeuV3.sol";

/**
 * @dev NeuDaoLock locks Ether donated from Neulock's sponsors until the
 * operator (currently managed by Studio V) sets the address of a permanent DAO
 * contract and the holders of at least 7 governance tokens agree to unlock the
 * funds by calling unlock(tokenId), which registers their token as a "key".
 * 
 * The operator can set the DAO address and, after that, the holders of
 * governance tokens can vote for unlocking the funds. If the operator changes
 * the DAO address, the votes are reset.
 * 
 * Given that there are at least 7 key tokens, anyone can call withdraw() to
 * send the locked funds to the DAO address.
 */
contract NeuDaoLockV2 is AccessControl, INeuDaoLockV1 {
    using EnumerableSet for EnumerableSet.UintSet;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    uint256 public constant REQUIRED_KEY_TOKENS = 7;
    INeuTokenV3 immutable private _neuContract;

    address public neuDaoAddress;
    
    // slither-disable-next-line uninitialized-state-variables (see https://github.com/crytic/slither/issues/456)
    mapping(uint256 => EnumerableSet.UintSet) private _keyTokenIds;
    uint256 private _keyTokenIdsIndex;

    constructor(
        address defaultAdmin,
        address operator,
        address neuContractAddress
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(OPERATOR_ROLE, operator);

        _neuContract = INeuTokenV3(neuContractAddress);
    }

    function keyTokenIds(uint256 index) external view returns (uint256) {
        return _getCurrentKeysSet().at(index);
    }

    function setNeuDaoAddress(address newNeoDaoAddress) external onlyRole(OPERATOR_ROLE) {
        _clearKeysSet();

        // slither-disable-next-line missing-zero-check (we may want to set it again to 0x0, to prevent users from unlocking before we decide on a new DAO)
        neuDaoAddress = newNeoDaoAddress;

        emit AddressChange(newNeoDaoAddress);
    }

    function unlock(uint256 neuTokenId) external {
        require(_neuContract.ownerOf(neuTokenId) == msg.sender, "Caller does not own NEU");
        require(_neuContract.isGovernanceToken(neuTokenId), "Provided token is not governance");
        require(neuDaoAddress != address(0), "NEU DAO address not set");

        EnumerableSet.UintSet storage keysSet = _getCurrentKeysSet();

        require(keysSet.add(neuTokenId), "Token already used as key");

        emit Unlock(neuTokenId);
    }

    function cancelUnlock(uint256 neuTokenId) external {
        require(_neuContract.ownerOf(neuTokenId) == msg.sender, "Caller does not own NEU");

        EnumerableSet.UintSet storage keysSet = _getCurrentKeysSet();

        require(keysSet.remove(neuTokenId), "NEU not found");

        emit UnlockCancel(neuTokenId);
    }

    function withdraw() external {
        require(_getCurrentKeysSet().length() >= REQUIRED_KEY_TOKENS, "Not enough key tokens");

        uint256 balance = address(this).balance;

        emit Withdraw(balance);

        // slither-disable-start low-level-calls (calling like this is the best practice for sending Ether)
        // slither-disable-next-line arbitrary-send-eth (neuDaoAddress is only set by the operator and approved by key holders who have called unlock())
        (bool sent, ) = address(neuDaoAddress).call{value: balance}("");
        require(sent, "Failed to send Ether");
        // slither-disable-end low-level-calls
    }

    receive() external payable {}

    function _getCurrentKeysSet() internal view returns (EnumerableSet.UintSet storage) {
        return _keyTokenIds[_keyTokenIdsIndex];
    }

    function _clearKeysSet() internal {
        _keyTokenIdsIndex += 1;
    }
}