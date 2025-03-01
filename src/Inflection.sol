// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/**
 * @title Inflection with True Split-Fixed-Cost Pledges
 * @notice This contract demonstrates a stablecoin-only crowdfunding system
 *         with a special "pledge" mechanic for SplitFixedCost campaigns.
 *
 *         For SplitFixedCost:
 *           - Donors call pledgeSplitFixedCost(...) to signal participation
 *           - No tokens are transferred yet
 *           - At the end, we calculate costPerPledger = goal / pledgerCount
 *           - We call transferFrom(...) on each pledger to pull their share
 *           - If any transferFrom fails, the entire transaction reverts and the campaign fails
 *
 *         The other campaign types (AnythingHelps, Goal, PerPerson) remain
 *         standard and require direct deposits via updateCampaign(...).
 */

interface IERC20 {
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
    // We'll also need transferFrom for the SplitFixedCost mechanic:
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract Inflection is AutomationCompatibleInterface {
    // ------------------------------------------------------------------------
    // Enums & Data Structures
    // ------------------------------------------------------------------------
    enum CampaignType {
        AnythingHelps, // Tips automatically at deadline (no minimum)
        Goal, // Must reach or exceed 'goal'
        PerPerson, // Must have exactly maxDonors each paying >= cost
        SplitFixedCost // Must raise 'goal' by charging pledgers at the end
    }

    struct Campaign {
        uint256 id;
        CampaignType campaignType;
        bool isActive;
        address token; // ERC20 stablecoin
        string name;
        string image;
        string description;
        uint256 balance; // total tokens credited so far
        uint256 deadline;
        address[] donors; // list of donors or pledgers
        uint256 goal;
        uint256 maxDonors; // used in PerPerson or SplitFixedCost
        address recipient;
        uint256 numDonations; // how many calls to updateCampaign or pledge
    }

    address public owner;
    uint256 private campaignCount;
    Campaign[] private campaigns;

    // For normal campaigns (AnythingHelps, Goal, PerPerson), we track each donor's deposit:
    mapping(uint256 => mapping(address => uint256)) public campaignDonations;

    // For SplitFixedCost campaigns, donors do not deposit upfront. They only "pledge".
    // We track each campaign's pledgers with a boolean or "pledged" count.
    mapping(uint256 => mapping(address => bool)) public splitPledges;

    // Fee in basis points (1.5% default):
    uint256 public feeBps = 15;

    mapping(address => bool) public whitelistedTokens;

    // ------------------------------------------------------------------------
    // Modifiers & Constructor
    // ------------------------------------------------------------------------
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Example whitelisted stablecoins:
        whitelistedTokens[0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238] = true; // ETH_SEPOLIA_USDC
        whitelistedTokens[0x036CbD53842c5426634e7929541eC2318f3dCF7e] = true; // BASE_SEPOLIA_USDC
        whitelistedTokens[0x866386C7f4F2A5f46C5F4566D011dbe3e8679BE4] = true; // ETH_SEPOLIA_RLUSD
    }

    // ------------------------------------------------------------------------
    // Chainlink Automation
    // ------------------------------------------------------------------------
    function checkUpkeep(
        bytes calldata
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256[] memory overdueIds = new uint256[](campaignCount);
        uint256 idx = 0;

        for (uint256 i = 0; i < campaignCount; i++) {
            Campaign storage c = campaigns[i];
            if (c.isActive && block.timestamp >= c.deadline) {
                overdueIds[idx] = i;
                idx++;
            }
        }

        if (idx > 0) {
            upkeepNeeded = true;
            overdueIds = sliceArray(overdueIds, idx);
            performData = abi.encode(overdueIds);
        } else {
            upkeepNeeded = false;
            performData = "";
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        uint256[] memory overdueIds = abi.decode(performData, (uint256[]));
        for (uint256 i = 0; i < overdueIds.length; i++) {
            uint256 cid = overdueIds[i];
            if (cid < campaignCount) {
                Campaign storage c = campaigns[cid];
                if (c.isActive && block.timestamp >= c.deadline) {
                    handleCampaignEnd(cid);
                }
            }
        }
    }

    function sliceArray(
        uint256[] memory array,
        uint256 length
    ) internal pure returns (uint256[] memory) {
        uint256[] memory trimmed = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            trimmed[i] = array[i];
        }
        return trimmed;
    }

    // ------------------------------------------------------------------------
    // Owner Functions
    // ------------------------------------------------------------------------
    function setFee(uint256 _feeBps) external onlyOwner {
        feeBps = _feeBps;
    }

    function deleteCampaign(uint256 _campaignId) external onlyOwner {
        require(_campaignId < campaignCount, "Invalid campaignId");
        delete campaigns[_campaignId];
    }

    function setTokenWhitelisted(
        address _token,
        bool _isWhitelisted
    ) external onlyOwner {
        whitelistedTokens[_token] = _isWhitelisted;
    }

    // ------------------------------------------------------------------------
    // Campaign Creation
    // ------------------------------------------------------------------------
    function createCampaign(
        address _token,
        CampaignType _campaignType,
        string calldata _name,
        string calldata _image,
        string calldata _description,
        address _recipient,
        uint256 _goal,
        uint256 _deadline,
        uint256 _maxDonors
    ) external {
        require(_token != address(0), "Token=0");
        require(whitelistedTokens[_token], "Token not whitelisted");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_description).length > 0, "Description required");
        require(_recipient != address(0), "Recipient=0");
        require(_deadline > block.timestamp, "Deadline in past");
        require(_goal > 0, "Goal>0");

        if (
            _campaignType == CampaignType.PerPerson ||
            _campaignType == CampaignType.SplitFixedCost
        ) {
            require(_maxDonors > 0, "maxDonors>0");
        }

        Campaign memory newC = Campaign({
            id: campaignCount,
            campaignType: _campaignType,
            isActive: true,
            token: _token,
            name: _name,
            image: _image,
            description: _description,
            balance: 0,
            deadline: _deadline,
            donors: new address[](0),
            goal: _goal,
            maxDonors: _maxDonors,
            recipient: _recipient,
            numDonations: 0
        });

        campaigns.push(newC);
        campaignCount++;
    }

    // ------------------------------------------------------------------------
    // Normal Donation Flow (for AnythingHelps, Goal, PerPerson)
    // ------------------------------------------------------------------------
    /**
     * @notice For typical campaigns that require depositing tokens upfront,
     *         call updateCampaign() after transferring tokens to the contract.
     */
    function updateCampaign(
        uint256 _campaignId,
        uint256 _amount,
        address _donor
    ) external {
        require(_campaignId < campaignCount, "Invalid campaignId");
        Campaign storage c = campaigns[_campaignId];
        require(c.isActive, "Campaign ended");
        require(block.timestamp < c.deadline, "Deadline passed");
        require(_amount > 0, "Amount>0");
        require(_donor != address(0), "Donor=0");
        require(c.donors.length < c.maxDonors, "Max pledgers reached");

        // For "SplitFixedCost" below, we do NOT deposit tokens here. So skip if it's that type:
        require(
            c.campaignType != CampaignType.SplitFixedCost,
            "Use pledgeSplitFixedCost"
        );

        // For "PerPerson" campaigns, we require the exact equal split amount:
        if (c.campaignType == CampaignType.PerPerson) {
            require(_amount == c.goal / c.maxDonors, "Amount must be goal / maxDonors");
        }

        // Increase the campaign's recorded balance
        c.balance += _amount;

        // If new donor, record them
        if (campaignDonations[_campaignId][_donor] == 0) {
            c.donors.push(_donor);
        }
        campaignDonations[_campaignId][_donor] += _amount;
        c.numDonations++;
    }

    // ------------------------------------------------------------------------
    // Split Fixed Cost - Pledging Mechanic
    // ------------------------------------------------------------------------
    /**
     * @notice Pledge to a SplitFixedCost campaign. No tokens are transferred
     *         right now. We'll pull tokens at the end if enough people joined.
     */
    function pledgeSplitFixedCost(
        uint256 _campaignId,
        address pledger
    ) external {
        Campaign storage c = campaigns[_campaignId];
        require(c.isActive, "Ended");
        require(block.timestamp < c.deadline, "Deadline passed");
        require(
            c.campaignType == CampaignType.SplitFixedCost,
            "Not SplitFixedCost"
        );
        require(!splitPledges[_campaignId][pledger], "Already pledged");
        require(c.donors.length < c.maxDonors, "Max pledgers reached");

        // Mark the pledger
        splitPledges[_campaignId][pledger] = true;
        c.donors.push(pledger);
        c.numDonations++;
    }

    // ------------------------------------------------------------------------
    // Ending a Campaign (Performing Payout or Refund)
    // ------------------------------------------------------------------------
    function handleCampaignEnd(uint256 _campaignId) public {
        require(_campaignId < campaignCount, "Invalid campaignId");
        Campaign storage c = campaigns[_campaignId];
        require(c.isActive, "Already ended");
        require(block.timestamp >= c.deadline, "Not yet due");

        if (c.donors.length == 0) {
            // no fee collected
            _refundAndClose(c);
            return;
        }

        if (c.campaignType == CampaignType.AnythingHelps) {
            // Always pays out
            _payoutAndClose(c);
        } else if (c.campaignType == CampaignType.Goal) {
            // Must reach or exceed goal
            if (c.balance >= c.goal) {
                _payoutAndClose(c);
            } else {
                _refundAndClose(c);
            }
        } else if (c.campaignType == CampaignType.PerPerson) {
            // Must have exactly maxDonors
            if (c.donors.length == c.maxDonors) {
                _payoutAndClose(c);
            } else {
                _refundAndClose(c);
            }
        } else if (c.campaignType == CampaignType.SplitFixedCost) {
            // We do the new "pledging" approach:
            _handleSplitFixedCostEnd(c);
        }
    }

    /**
     * @dev If we have enough pledgers, each must pay goal/pledgerCount. We attempt
     *      transferFrom(...) from each pledger. If any fail, we revert => campaign fails.
     */
    function _handleSplitFixedCostEnd(Campaign storage c) internal {
        uint256 pledgerCount = c.donors.length;
        require(pledgerCount > 0, "No pledgers");

        // cost per person (integer division).
        // If you want decimals, consider a scaling factor or check token decimals.
        uint256 costPerPerson = c.goal / pledgerCount;
        require(costPerPerson > 0, "Not enough pledgers? costPer=0");

        // We'll pull from each pledger
        IERC20 token = IERC20(c.token);
        uint256 totalPulled = 0;

        for (uint256 i = 0; i < c.donors.length; i++) {
            address pledger = c.donors[i];
            // ensure they've pledged
            if (splitPledges[c.id][pledger]) {
                // Attempt transferFrom the pledger
                bool success = token.transferFrom(
                    pledger,
                    address(this),
                    costPerPerson
                );
                require(success, "transferFrom failed (approve/balance?)");
                totalPulled += costPerPerson;
            }
        }

        // Now totalPulled should == costPerPerson * pledgerCount
        // But if integer division is smaller than the real fraction, we might be under.
        // We'll do a final check:
        require(totalPulled >= c.goal, "Under goal due to rounding");

        // We track c.balance now so that we can do normal _payoutAndClose
        c.balance = totalPulled;

        // Then pay out minus fee
        _payoutAndClose(c);
    }

    /**
     * @notice Force refunds if needed, for the normal deposit-based campaigns.
     *         For SplitFixedCost with "pledge," there's no deposit to refund
     *         until after they've actually paid, but we revert the entire
     *         end process if it fails. So this is mostly for other types.
     */
    function refundDonors(uint256 _campaignId) external {
        require(_campaignId < campaignCount, "Invalid campaignId");
        Campaign storage c = campaigns[_campaignId];
        require(c.isActive, "Ended");
        _refundAndClose(c);
    }

    // ------------------------------------------------------------------------
    // Internal Helpers
    // ------------------------------------------------------------------------
    function _payoutAndClose(Campaign storage c) internal {
        uint256 total = c.balance;
        uint256 feeAmount = (total * feeBps) / 1000;
        IERC20 token = IERC20(c.token);

        // Transfer fee to owner
        require(token.transfer(owner, feeAmount), "Fee transfer failed");
        // Transfer remainder to recipient
        require(
            token.transfer(c.recipient, total - feeAmount),
            "Payout failed"
        );

        c.isActive = false;
        c.balance = 0;
    }

    function _refundAndClose(Campaign storage c) internal {
        // For normal deposit-based campaigns, we have a recorded .balance from donors.
        // For split pledges, there's no deposit to "refund" unless we want partial logic.
        // We'll just do a normal refund if .balance > 0
        uint256 cid = c.id;
        IERC20 token = IERC20(c.token);

        for (uint256 i = 0; i < c.donors.length; i++) {
            address donor = c.donors[i];
            uint256 donated = campaignDonations[cid][donor];
            if (donated > 0) {
                campaignDonations[cid][donor] = 0;
                require(token.transfer(donor, donated), "Refund fail");
            }
        }

        c.isActive = false;
        c.balance = 0;
    }

    // ------------------------------------------------------------------------
    // View Functions
    // ------------------------------------------------------------------------
    function getCampaign(
        uint256 _campaignId
    ) external view returns (Campaign memory) {
        require(_campaignId < campaignCount, "Invalid campaignId");
        return campaigns[_campaignId];
    }

    function getAllCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }

    function getCampaignCount() external view returns (uint256) {
        return campaignCount;
    }
}
