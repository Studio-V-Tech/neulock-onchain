// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.27;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import {INeuStorage} from "./interfaces/INeuStorage.sol";
import {Neu} from "./Neu.sol";

contract NeuStorage is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    INeuStorage
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    Neu private _neuContract;
    mapping(address => bytes) private _userdata;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address defaultAdmin,
        address upgrader,
        address neuContractAddress
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, upgrader);

        _neuContract = Neu(neuContractAddress);
    }

    function saveData(uint256 tokenId, bytes memory data) external payable {
        require(_neuContract.ownerOf(tokenId) == msg.sender, "Caller does not own NEU token");

        if (msg.value > 0) {
            _neuContract.increaseSponsorPoints{value: msg.value}(tokenId);
        }

        _userdata[msg.sender] = data;
    }

    function retrieveData(address owner) external view returns (bytes memory) {
        return _userdata[owner];
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}
}

