// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Inflection} from "../src/Inflection.sol";

contract InflectionScript is Script {
    Inflection public inflection;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        inflection = new Inflection();

        vm.stopBroadcast();
    }
}
