// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Inflection, Campaign, CampaignType} from "../src/Inflection.sol";

contract InflectionTest is Test {
    Inflection public inflection;
    address public recipient;
    uint256 public deadline;

    function setUp() public {
        inflection = new Inflection();
        recipient = address(0x1);
        deadline = block.timestamp + 1 days;
    }

    function test_AnythingHelpsCampaign() public {
        // Create campaign
        inflection.createCampaign(
            CampaignType.AnythingHelps,
            "Help Fund",
            "image.jpg",
            "Description",
            recipient,
            100 ether,  // goal
            deadline,
            0           // maxDonors
        );

        // Test donation
        vm.deal(address(this), 1 ether);
        inflection.donate{value: 1 ether}(0, 1 ether);
        
        Campaign memory campaign = inflection.getCampaign(0);
        assertEq(campaign.balance, 1 ether);
        assertEq(campaign.numDonors, 1);
    }

    function test_GoalCampaign() public {
        // Create campaign
        inflection.createCampaign(
            CampaignType.Goal,
            "Goal Fund",
            "image.jpg",
            "Description",
            recipient,
            10 ether,   // goal
            deadline,
            0           // maxDonors
        );

        // Test successful goal completion
        address donor1 = address(0x2);
        address donor2 = address(0x3);
        
        vm.deal(donor1, 6 ether);
        vm.deal(donor2, 4 ether);
        
        vm.prank(donor1);
        inflection.donate{value: 6 ether}(0, 6 ether);
        
        vm.prank(donor2);
        inflection.donate{value: 4 ether}(0, 4 ether);

        Campaign memory campaign = inflection.getCampaign(0);
        assertEq(campaign.balance, 10 ether);
        assertEq(campaign.numDonors, 2);
    }

    function test_PerPersonCampaign() public {
        // Create campaign
        inflection.createCampaign(
            CampaignType.PerPerson,
            "Per Person Fund",
            "image.jpg",
            "Description",
            recipient,
            6 ether,    // goal (2 ether per person)
            deadline,
            3           // maxDonors
        );

        // Test three people donating equal amounts
        address[] memory donors = new address[](3);
        for(uint i = 0; i < 3; i++) {
            donors[i] = address(uint160(i + 1));
            vm.deal(donors[i], 2 ether);
            vm.prank(donors[i]);
            inflection.donate{value: 2 ether}(0, 2 ether);
        }

        Campaign memory campaign = inflection.getCampaign(0);
        assertEq(campaign.balance, 6 ether);
        assertEq(campaign.numDonors, 3);
    }

    function test_CampaignEndAndRefund() public {
        // Create campaign
        inflection.createCampaign(
            CampaignType.Goal,
            "Goal Fund",
            "image.jpg",
            "Description",
            recipient,
            10 ether,   // goal
            deadline,
            0           // maxDonors
        );

        // Make partial donation
        address donor = address(0x2);
        vm.deal(donor, 5 ether);
        vm.prank(donor);
        inflection.donate{value: 5 ether}(0, 5 ether);

        // Fast forward past deadline
        vm.warp(deadline + 1);

        // Test refund
        uint256 balanceBefore = donor.balance;
        inflection.handleCampaignEnd(0);
        assertEq(donor.balance, balanceBefore + 5 ether);
    }
}
