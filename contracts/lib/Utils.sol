// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.28;

library Bytes8Utils {
    function toString(bytes8 data) internal pure returns (string memory) {
        uint8 i = 0;

        while(i < 8 && data[i] != 0) {
            i++;
        }

        bytes memory bytesArray = new bytes(i);

        for (i = 0; i < 8 && data[i] != 0; i++) {
            bytesArray[i] = data[i];
        }

        return string(bytesArray);
    }
}