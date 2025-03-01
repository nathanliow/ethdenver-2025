// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Inflection.sol";
import "./mocks/MockERC20.sol";

contract InflectionSplitTest is Test {
    Inflection public inflection;
    MockERC20 public token;
    address public recipient;
    uint256 public deadline;
    address pledger1;
    address pledger2;
    address pledger3;

    uint256 constant DEPOSIT = 1000e6; // 1000 tokens

    function setUp() public {
        // Setup accounts
        pledger1 = address(0x1);
        pledger2 = address(0x2);
        pledger3 = address(0x3);

        // Deploy contracts
        inflection = new Inflection();
        token = new MockERC20("MockUSD", "mUSD", 6);

        // Whitelist token
        inflection.setTokenWhitelisted(address(token), true);

        token.mint(pledger1, DEPOSIT);
        token.mint(pledger2, DEPOSIT);
        token.mint(pledger3, DEPOSIT);

        recipient = address(0xAA);
        deadline = block.timestamp + 1 days;
    }

    function testCreateCampaign() public {
        inflection.createCampaign(
            address(token),
            0,
            "title",
            "test.img",
            "desc",
            recipient,
            500e6, // goal: 500 tokens
            deadline,
            10
        );

        Inflection.Campaign memory c = inflection.getCampaign(0);
        assertEq(c.goal, 500e6);
        assertEq(c.deadline, deadline);
        assertEq(c.recipient, recipient);
        assertEq(c.maxDonors, 10);

        // End campaign
        vm.warp(deadline + 1);
        inflection.handleCampaignEnd(0);

        // check campaign is ended
        c = inflection.getCampaign(0);
        assertFalse(c.isActive);
        assertEq(c.balance, 0);
    }

    function testAnythingHelpsPass() public {
        inflection.createCampaign(
            address(token),
            0,
            "title",
            "test.img",
            "desc",
            recipient,
            500e6, // goal: 500 tokens
            deadline,
            10
        );

        // Simulate pledger1 making a donation
        vm.startPrank(pledger1);
        token.transfer(address(inflection), 20e6); // 20 tokens
        inflection.updateCampaign(0, 20e6, pledger1);
        vm.stopPrank();

        // End campaign
        vm.warp(deadline + 1);
        inflection.handleCampaignEnd(0);

        // Check fee and payouts
        uint256 fee = (20e6 * 15) / 1000; // 1.5%
        assertEq(token.balanceOf(recipient), 20e6 - fee);
        assertEq(token.balanceOf(pledger1), DEPOSIT - 20e6);

        // check campaign is ended
        Inflection.Campaign memory c = inflection.getCampaign(0);
        assertFalse(c.isActive);
        assertEq(c.balance, 0);
    }

    function testGoalPass() public {
        inflection.createCampaign(
            address(token),
            1,
            "title",
            "test.img",
            "desc",
            recipient,
            100e6, // goal: 100 tokens
            deadline,
            10
        );

        // Meet the goal
        vm.startPrank(pledger1);
        token.transfer(address(inflection), 100e6);
        inflection.updateCampaign(0, 100e6, pledger1);
        vm.stopPrank();

        // End campaign
        vm.warp(deadline + 1);
        inflection.handleCampaignEnd(0);

        // Check fee and payout
        uint256 fee = (100e6 * 15) / 1000; // 1.5%
        assertEq(token.balanceOf(recipient), 100e6 - fee);
        assertEq(token.balanceOf(pledger1), DEPOSIT - 100e6);

        // check campaign is ended
        Inflection.Campaign memory c = inflection.getCampaign(0);
        assertFalse(c.isActive);
        assertEq(c.balance, 0);
    }
    

    function testGoalFail() public {
        inflection.createCampaign(
            address(token),
            1,
            "title",
            "test.img",
            "desc",
            recipient,
            100e6, // goal: 100 tokens
            deadline,
            10
        );

        // Don't meet the goal: 60 tokens
        vm.startPrank(pledger1);
        token.transfer(address(inflection), 50e6);
        inflection.updateCampaign(0, 50e6, pledger1);
        vm.stopPrank();

        vm.startPrank(pledger2);
        token.transfer(address(inflection), 10e6);
        inflection.updateCampaign(0, 10e6, pledger2);
        vm.stopPrank();

        // End campaign
        vm.warp(deadline + 1);
        inflection.handleCampaignEnd(0);

        // Check fee and payout
        assertEq(token.balanceOf(pledger1), DEPOSIT);
        assertEq(token.balanceOf(pledger2), DEPOSIT);
        assertEq(token.balanceOf(recipient), 0);
    }

    function testPerPersonPass() public {
        inflection.createCampaign(
            address(token),
            2,
            "test",
            "test.img",
            "desc",
            recipient,
            300e6, // goal: 300 tokens
            deadline,
            3
        );

        // Three pledgers join
        vm.prank(pledger1);
        token.transfer(address(inflection), 100e6);
        inflection.updateCampaign(0, 100e6, pledger1);

        vm.prank(pledger2);
        token.transfer(address(inflection), 100e6);
        inflection.updateCampaign(0, 100e6, pledger2);

        vm.prank(pledger3);
        token.transfer(address(inflection), 100e6);
        inflection.updateCampaign(0, 100e6, pledger3);

        // End campaign
        vm.warp(deadline + 1);
        inflection.handleCampaignEnd(0);

        // Each should have paid 100 tokens
        assertEq(token.balanceOf(pledger1), DEPOSIT - 100e6);
        assertEq(token.balanceOf(pledger2), DEPOSIT - 100e6);
        assertEq(token.balanceOf(pledger3), DEPOSIT - 100e6);

        // Check recipient got funds minus fee
        uint256 fee = 300e6 * (15 / 1000);
        assertEq(token.balanceOf(recipient), 300e6 - fee);

        // check campaign is ended
        Inflection.Campaign memory c = inflection.getCampaign(0);
        assertFalse(c.isActive);
        assertEq(c.balance, 0);
    }

    function testPerPersonFailUnequalDonations() public {
        inflection.createCampaign(
            address(token),
            2,
            "test",
            "test.img",
            "desc",
            recipient,
            300e6, // goal: 300 tokens; each pledger should ONLY pay 100 tokens
            deadline,
            3
        );

        // Three pledgers join
        vm.prank(pledger1);
        token.transfer(address(inflection), 100e6);
        inflection.updateCampaign(0, 100e6, pledger1);

        vm.prank(pledger2);
        token.transfer(address(inflection), 200e6);
        vm.expectRevert("Amount must be goal / maxDonors");
        inflection.updateCampaign(0, 200e6, pledger2);
    }

    function testPerPersonFailGoalNotMet() public {
        inflection.createCampaign(
            address(token),
            2,
            "test",
            "test.img",
            "desc",
            recipient,
            300e6, // goal: 300 tokens; each pledger should ONLY pay 100 tokens
            deadline,
            3
        );

        // Two pledgers join
        vm.prank(pledger1);
        token.transfer(address(inflection), 100e6);
        inflection.updateCampaign(0, 100e6, pledger1);

        vm.prank(pledger2);
        token.transfer(address(inflection), 100e6);
        inflection.updateCampaign(0, 100e6, pledger2);

        // End campaign
        vm.warp(deadline + 1);
        inflection.handleCampaignEnd(0);

        // Check for successful refund
        assertEq(token.balanceOf(pledger1), DEPOSIT);
        assertEq(token.balanceOf(pledger2), DEPOSIT);
        assertEq(token.balanceOf(recipient), 0);
    }

    function testSplitFixedCostPass() public {
        // Create a SplitFixedCost campaign: goal=3000, maxDonors=10
        inflection.createCampaign(
            address(token),
            3,
            "SplitTest",
            "",
            "desc",
            recipient,
            3000e6, // goal: 3000 tokens
            deadline,
            10
        );

        // Three pledgers join
        vm.startPrank(pledger1);
        token.approve(address(inflection), 3000e6);
        inflection.pledgeSplitFixedCost(0, pledger1);
        vm.stopPrank();

        vm.startPrank(pledger2);
        token.approve(address(inflection), 3000e6);
        inflection.pledgeSplitFixedCost(0, pledger2);
        vm.stopPrank();

        vm.startPrank(pledger3);
        token.approve(address(inflection), 3000e6);
        inflection.pledgeSplitFixedCost(0, pledger3);
        vm.stopPrank();

        // check no tokens were deducted before deadline
        assertEq(token.balanceOf(pledger1), DEPOSIT);
        assertEq(token.balanceOf(pledger2), DEPOSIT);
        assertEq(token.balanceOf(pledger3), DEPOSIT);

        // end campaign: GOAL MET
        vm.warp(deadline + 1);
        inflection.handleCampaignEnd(0);

        // check final balances => each paid 1000 since goal=3000 and donors=3
        assertEq(token.balanceOf(pledger1), DEPOSIT - 1000e6);
        assertEq(token.balanceOf(pledger2), DEPOSIT - 1000e6);
        assertEq(token.balanceOf(pledger3), DEPOSIT - 1000e6);

        // 1.5% fee => 45, remainder => 2955
        uint256 fee = (3000e6 * 15) / 1000;
        assertEq(token.balanceOf(recipient), 3000e6 - fee);
        assertEq(token.balanceOf(inflection.owner()), fee);

        // check campaign is ended
        Inflection.Campaign memory c = inflection.getCampaign(0);
        assertFalse(c.isActive);
        assertEq(c.balance, 0);
    }

    function testSplitFixedCostFailNoPledgers() public {
        // Create a SplitFixedCost campaign: goal=3000, maxDonors=10
        inflection.createCampaign(
            address(token),
            3,
            "SplitTest",
            "",
            "desc",
            recipient,
            3000e6, // goal: 3000 tokens
            deadline,
            10
        );

        // No one pledgers join

        // end campaign: GOAL MET
        vm.warp(deadline + 1);
        inflection.handleCampaignEnd(0);

        // check campaign is ended
        Inflection.Campaign memory c = inflection.getCampaign(0);
        assertFalse(c.isActive);
        assertEq(c.balance, 0);
    }

    // function testSplitFixedCostFail_NoApproval() public {
    //     inflection.createCampaign(
    //         address(token),
    //         Inflection.CampaignType.SplitFixedCost,
    //         "SplitFail",
    //         "",
    //         "desc",
    //         recipient,
    //         3000,
    //         deadline,
    //         10
    //     );

    //     // pledger1
    //     vm.startPrank(pledger1);
    //     token.mint(pledger1, 3000);
    //     token.approve(address(inflection), 3000);
    //     inflection.pledgeSplitFixedCost(0);
    //     vm.stopPrank();

    //     // pledger2
    //     vm.startPrank(pledger2);
    //     token.mint(pledger2, 3000);
    //     token.approve(address(inflection), 3000);
    //     inflection.pledgeSplitFixedCost(0);
    //     vm.stopPrank();

    //     // pledger3 => no approve
    //     vm.startPrank(pledger3);
    //     token.mint(pledger3, 3000);
    //     inflection.pledgeSplitFixedCost(0);
    //     vm.stopPrank();

    //     vm.warp(deadline + 1);

    //     vm.expectRevert("transferFrom failed (approve/balance?)");
    //     inflection.handleCampaignEnd(0);

    //     // ensure no tokens were deducted
    //     assertEq(token.balanceOf(pledger1), 3000);
    //     assertEq(token.balanceOf(pledger2), 3000);
    //     assertEq(token.balanceOf(pledger3), 3000);
    //     assertEq(token.balanceOf(recipient), 0);
    // }

    // function testAnythingHelps() public {
    //     inflection.createCampaign(
    //         address(token),
    //         Inflection.CampaignType.AnythingHelps,
    //         "AH",
    //         "",
    //         "desc",
    //         recipient,
    //         1000,
    //         deadline,
    //         0
    //     );

    //     address donor = address(0x999);
    //     vm.startPrank(donor);
    //     token.mint(donor, 2000);
    //     // user "pretends" to transfer 500 to inflection, then calls updateCampaign
    //     inflection.updateCampaign(0, 500, donor);
    //     vm.stopPrank();

    //     // check
    //     Inflection.Campaign memory c1 = inflection.getCampaign(0);
    //     assertEq(c1.balance, 500);

    //     vm.warp(deadline + 1);
    //     inflection.handleCampaignEnd(0);

    //     Inflection.Campaign memory c2 = inflection.getCampaign(0);
    //     assertFalse(c2.isActive);
    //     assertEq(c2.balance, 0);
    // }

    // function testAnythingHelps() public {
    //     // 1) Create the campaign
    //     inflection.createCampaign(
    //         address(token),
    //         Inflection.CampaignType.AnythingHelps,
    //         "AH",
    //         "",
    //         "desc",
    //         recipient,
    //         1000, // goal
    //         deadline,
    //         0
    //     );

    //     // 2) Donor "mints" tokens, then transfers to the contract
    //     address donor = address(0x999);
    //     vm.startPrank(donor);

    //     // Mint 2000 to donor
    //     token.mint(donor, 2000);

    //     // Actually transfer 500 to the contract
    //     token.transfer(address(inflection), 500);

    //     // 3) Now call updateCampaign to record that deposit
    //     inflection.updateCampaign(0, 500, donor);

    //     vm.stopPrank();

    //     // The contract now physically holds 500 tokens,
    //     // so it can pay out later
    //     Inflection.Campaign memory c1 = inflection.getCampaign(0);
    //     assertEq(c1.balance, 500);

    //     vm.warp(deadline + 1);
    //     inflection.handleCampaignEnd(0);

    //     // Now the contract can do a real transfer to the recipient
    //     // Let's see if it ended
    //     Inflection.Campaign memory c2 = inflection.getCampaign(0);
    //     assertFalse(c2.isActive);
    //     assertEq(c2.balance, 0);

    //     // The contract should have paid tokens to 'recipient'
    //     // minus fee, if the campaign always pays out. Let's confirm
    //     // 1.5% of 500 = 7.5 -> truncated to 7 if integer math
    //     // The final behavior depends on your fee logic.
    //     // You can do an assert here if desired:
    //     // assertEq(token.balanceOf(recipient), 493);
    //     // assertEq(token.balanceOf(inflection.owner()), 7);
    // }
}
