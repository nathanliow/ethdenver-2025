// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Inflection.sol";

contract InflectionTest is Test {
    Inflection inflection;
    
    function setUp() public {
        inflection = new Inflection();
    }

    function testOwnerIsCorrect() public {
        assertEq(inflection.owner(), address(this));
    }

    function testFeeCanBeUpdated() public {
        inflection.setFee(20);
        assertEq(inflection.feeBps(), 20);
    }
}

