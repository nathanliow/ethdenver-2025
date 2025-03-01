// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// from ethdenver-2025 dir, run 
// forge script script/Deploy.s.sol --slow --multi --broadcast --private-key da9b5c4f7b9d8725634e5a6905d2b02bfc5233c1920c33cb1940e04b6d5652b2

import {Script, console} from "forge-std/Script.sol";
import {Inflection} from "../src/Inflection.sol";

contract InflectionScript is Script {
    Inflection public inflection1;
    Inflection public inflection2;
    
    function run() public { 
        vm.createSelectFork("base-sepolia");
        vm.startBroadcast();
        inflection1 = new Inflection();
        vm.stopBroadcast();

        vm.createSelectFork("polygon-amoy");
        vm.startBroadcast();
        inflection2 = new Inflection();
        vm.stopBroadcast();
    }
}
