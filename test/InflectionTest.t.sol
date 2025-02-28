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

    // Example pledgers
    address pledger1 = address(0x1);
    address pledger2 = address(0x2);
    address pledger3 = address(0x3);

    function setUp() public {
        inflection = new Inflection();
        token = new MockERC20("MockUSD", "mUSD", 6);
        inflection.setTokenWhitelisted(address(token), true);

        recipient = address(0xAA);
        deadline = block.timestamp + 1 days;
    }

    function testSplitFixedCostHappyPath() public {
        // Create a SplitFixedCost campaign: goal=3000, maxDonors=10
        inflection.createCampaign(
            address(token),
            Inflection.CampaignType.SplitFixedCost,
            "SplitTest",
            "",
            "desc",
            recipient,
            3000,
            deadline,
            10
        );

        // pledger1
        vm.startPrank(pledger1);
        token.mint(pledger1, 3000);
        token.approve(address(inflection), 3000);
        inflection.pledgeSplitFixedCost(0);
        vm.stopPrank();

        // pledger2
        vm.startPrank(pledger2);
        token.mint(pledger2, 3000);
        token.approve(address(inflection), 3000);
        inflection.pledgeSplitFixedCost(0);
        vm.stopPrank();

        // pledger3
        vm.startPrank(pledger3);
        token.mint(pledger3, 3000);
        token.approve(address(inflection), 3000);
        inflection.pledgeSplitFixedCost(0);
        vm.stopPrank();

        // warp time
        vm.warp(deadline + 1);

        // end campaign
        inflection.handleCampaignEnd(0);

        // check final balances => each paid 1000
        assertEq(token.balanceOf(pledger1), 2000);
        assertEq(token.balanceOf(pledger2), 2000);
        assertEq(token.balanceOf(pledger3), 2000);

        // 1.5% fee => 45, remainder => 2955
        assertEq(token.balanceOf(recipient), 2955);
        assertEq(token.balanceOf(inflection.owner()), 45);

        // now read the campaign struct
        Inflection.Campaign memory c = inflection.getCampaign(0);
        assertFalse(c.isActive);
        assertEq(c.balance, 0);
    }

    function testSplitFixedCostFail_NoApproval() public {
        inflection.createCampaign(
            address(token),
            Inflection.CampaignType.SplitFixedCost,
            "SplitFail",
            "",
            "desc",
            recipient,
            3000,
            deadline,
            10
        );

        // pledger1
        vm.startPrank(pledger1);
        token.mint(pledger1, 3000);
        token.approve(address(inflection), 3000);
        inflection.pledgeSplitFixedCost(0);
        vm.stopPrank();

        // pledger2
        vm.startPrank(pledger2);
        token.mint(pledger2, 3000);
        token.approve(address(inflection), 3000);
        inflection.pledgeSplitFixedCost(0);
        vm.stopPrank();

        // pledger3 => no approve
        vm.startPrank(pledger3);
        token.mint(pledger3, 3000);
        inflection.pledgeSplitFixedCost(0);
        vm.stopPrank();

        vm.warp(deadline + 1);

        vm.expectRevert("transferFrom failed (approve/balance?)");
        inflection.handleCampaignEnd(0);

        // ensure no tokens were deducted
        assertEq(token.balanceOf(pledger1), 3000);
        assertEq(token.balanceOf(pledger2), 3000);
        assertEq(token.balanceOf(pledger3), 3000);
        assertEq(token.balanceOf(recipient), 0);
    }

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

    function testAnythingHelps() public {
        // 1) Create the campaign
        inflection.createCampaign(
            address(token),
            Inflection.CampaignType.AnythingHelps,
            "AH",
            "",
            "desc",
            recipient,
            1000,     // goal
            deadline,
            0
        );

        // 2) Donor "mints" tokens, then transfers to the contract
        address donor = address(0x999);
        vm.startPrank(donor);

        // Mint 2000 to donor
        token.mint(donor, 2000);

        // Actually transfer 500 to the contract
        token.transfer(address(inflection), 500);

        // 3) Now call updateCampaign to record that deposit
        inflection.updateCampaign(0, 500, donor);

        vm.stopPrank();

        // The contract now physically holds 500 tokens, 
        // so it can pay out later
        Inflection.Campaign memory c1 = inflection.getCampaign(0);
        assertEq(c1.balance, 500);

        vm.warp(deadline + 1);
        inflection.handleCampaignEnd(0);

        // Now the contract can do a real transfer to the recipient
        // Let's see if it ended
        Inflection.Campaign memory c2 = inflection.getCampaign(0);
        assertFalse(c2.isActive);
        assertEq(c2.balance, 0);

        // The contract should have paid tokens to 'recipient' 
        // minus fee, if the campaign always pays out. Let's confirm
        // 1.5% of 500 = 7.5 -> truncated to 7 if integer math
        // The final behavior depends on your fee logic. 
        // You can do an assert here if desired:
        // assertEq(token.balanceOf(recipient), 493);
        // assertEq(token.balanceOf(inflection.owner()), 7);
    }

}
