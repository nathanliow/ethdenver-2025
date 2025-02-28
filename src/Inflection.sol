// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

/**
 * @title Inflection (Stablecoin-Only, No donate() Function)
 * @notice A "inflection" style crowdfunding contract that:
 *         1. Only accepts ERC20 stablecoins (no ETH).
 *         2. Has four campaign types: AnythingHelps, Goal, PerPerson, SplitFixedCost.
 *         3. Uses a 1.5% (configurable) fee on successful campaigns.
 *         4. Does NOT actively transferFrom donors. Instead, donors must
 *            transfer tokens externally, then call recordDonation() to update state.
 *
 * Usage Flow:
 *  1) Deploy contract.
 *  2) createCampaign(...) with a stablecoin address and desired parameters.
 *  3) Donor sends tokens directly to this contract via token.transfer(address(this), amount).
 *  4) Then call recordDonation(campaignId, amount, donor) to associate that deposit.
 *  5) After deadline, call handleCampaignEnd(...) to finalize (payout or refund).
 */

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract Inflection is KeeperCompatibleInterface {
    // ------------------------------------------------------------------------
    // Enums & Data Structures
    // ------------------------------------------------------------------------
    enum CampaignType {
        AnythingHelps,   // Tips automatically at deadline (no minimum)
        Goal,            // Must reach or exceed 'goal' total
        PerPerson,       // Must have exactly maxDonors, each paying >= cost share
        SplitFixedCost   // Must reach 'goal'; each paying >= goal/maxDonors
    }

    struct Campaign {
        uint256 id;               // Unique ID
        CampaignType campaignType; // Which type
        bool isActive;            // Whether campaign is still active
        address token;            // ERC20 token used for donations
        string name;              // Name/title
        string image;             // Optional image link
        string description;       // Short description
        uint256 balance;          // Tracked total of contributions
        uint256 deadline;         // Unix timestamp (end time)
        uint256 numDonors;        // Number of unique donors
        address[] donors;         // List of donor addresses
        uint256 goal;             // For Goal, SplitFixedCost, etc.
        uint256 maxDonors;        // For PerPerson, SplitFixedCost
        address recipient;        // Address receiving funds on success
        uint256 numDonations;     // Number of recordDonation() calls
    }

    // ------------------------------------------------------------------------
    // State Variables
    // ------------------------------------------------------------------------
    address public owner;                     // Contract owner (fee collector)
    uint256 private campaignCount;            // Count of campaigns created
    Campaign[] private campaigns;             // Array of all campaigns

    // campaignId -> (donor -> amount)
    mapping(uint256 => mapping(address => uint256)) public campaignDonations;

    // Fee in basis points; default 15 => 1.5%
    uint256 public feeBps = 15;

    // Add to state variables section
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
        
        // Whitelist RLUSD and USDC
        whitelistedTokens[0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD] = true; // RLUSD
        whitelistedTokens[0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48] = true; // USDC Mainnet
    }

    // chainlink shit
        /**
     * @notice Called by Chainlink nodes off-chain. We must decide if upkeep is needed.
     * @dev In a naive approach, we scan for an active campaign whose deadline is past.
     *      If found, we set upkeepNeeded = true and encode the campaign IDs in performData.
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // We'll gather the IDs of any campaigns that need to end
        uint256[] memory overdueIds = new uint256[](campaignCount);
        uint256 index = 0;

        for (uint256 i = 0; i < campaignCount; i++) {
            Campaign storage c = campaigns[i];
            if (c.isActive && block.timestamp >= c.deadline) {
                overdueIds[index] = c.id;
                index++;
                // NOTE: For gas reasons, you might break after finding a certain # of campaigns.
            }
        }

        // If index > 0, we have at least one campaign to end
        if (index > 0) {
            upkeepNeeded = true;
            // We only encode the relevant portion of overdueIds
            bytes memory encoded = abi.encode(sliceArray(overdueIds, index));
            performData = encoded;
        } else {
            upkeepNeeded = false;
            performData = "";
        }
    }

    /**
     * @notice Called by Chainlink on-chain if checkUpkeep returns true.
     * @dev We decode the IDs of the overdue campaigns and call handleCampaignEnd.
     */
    function performUpkeep(bytes calldata performData) external override {
        uint256[] memory ids = abi.decode(performData, (uint256[]));
        for (uint256 i = 0; i < ids.length; i++) {
            // safety check
            if (ids[i] < campaignCount) {
                Campaign storage c = campaigns[ids[i]];
                if (c.isActive && block.timestamp >= c.deadline) {
                    handleCampaignEnd(ids[i]);
                }
            }
        }
    }

    /**
     * @dev Helper to slice the overdueIds array down to `length`.
     */
    function sliceArray(uint256[] memory array, uint256 length)
        internal
        pure
        returns (uint256[] memory)
    {
        uint256[] memory newArr = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            newArr[i] = array[i];
        }
        return newArr;
    }



    // ------------------------------------------------------------------------
    // Owner Functions
    // ------------------------------------------------------------------------
    /**
     * @notice Adjust fee in basis points. e.g., 15 => 1.5%, 100 => 10%, etc.
     */
    function setFee(uint256 _feeBps) external onlyOwner {
        feeBps = _feeBps;
    }

    /**
     * @notice Delete a campaign by ID, clearing its data.
     * @dev    This does not remove the index from the array.
     */
    function deleteCampaign(uint256 _campaignId) external onlyOwner {
        require(_campaignId < campaignCount, "Invalid campaignId");
        delete campaigns[_campaignId];
    }

    // Add owner function to manage whitelisted tokens
    function setTokenWhitelisted(address _token, bool _isWhitelisted) external onlyOwner {
        whitelistedTokens[_token] = _isWhitelisted;
    }

    // ------------------------------------------------------------------------
    // Campaign Creation
    // ------------------------------------------------------------------------
    /**
     * @dev Create a new campaign. Must specify a valid (nonzero) ERC20 token address.
     * @param _token ERC20 token used for donations (e.g., RLUSD on testnet)
     * @param _campaignType Type of tipping campaign
     * @param _name A short name/title
     * @param _image An optional image link / IPFS
     * @param _description A short description
     * @param _recipient Who receives funds on success
     * @param _goal The total goal in smallest units (must be > 0)
     * @param _deadline Unix timestamp in the future
     * @param _maxDonors For PerPerson / SplitFixedCost campaigns
     */
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
        require(_token != address(0), "Token cannot be zero address");
        require(whitelistedTokens[_token], "Token not whitelisted");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_description).length > 0, "Description required");
        require(_recipient != address(0), "Recipient cannot be zero");
        require(_deadline > block.timestamp, "Deadline must be future");
        require(_goal > 0, "Goal must be > 0");
        if (_campaignType == CampaignType.PerPerson || _campaignType == CampaignType.SplitFixedCost) {
            require(_maxDonors > 0, "maxDonors must be > 0");
        }

        Campaign memory newCampaign = Campaign({
            id: campaignCount,
            campaignType: _campaignType,
            isActive: true,
            token: _token,
            name: _name,
            image: _image,
            description: _description,
            balance: 0,
            deadline: _deadline,
            numDonors: 0,
            donors: new address[](0),
            goal: _goal,
            maxDonors: _maxDonors,
            recipient: _recipient,
            numDonations: 0
        });
        campaigns.push(newCampaign);
        campaignCount++;
    }

    // ------------------------------------------------------------------------
    // Update Campaign (No Token Transfer)
    // ------------------------------------------------------------------------
    /**
     * @notice Update campaign balance and donor count.
     *
     * @param _campaignId Which campaign the donation is for
     * @param _amount     How many tokens (in smallest units) were donated
     * @param _donor      Address that made the off-chain transfer
     *
     * Requirements:
     *  - The campaign is active (not ended).
     *  - block.timestamp < campaign.deadline.
     *  - _amount > 0
     *  - Must not exceed certain limits based on campaign type.
     *  - For PerPerson/SplitFixedCost, each donor must meet the required share
     *    and cannot pledge multiple times if your logic prohibits that.
     */
    function updateCampaign(
        uint256 _campaignId,
        uint256 _amount,
        address _donor
    ) external {
        require(_campaignId < campaignCount, "Invalid campaignId");
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign ended or inactive");
        require(block.timestamp < campaign.deadline, "Deadline passed");
        require(_amount > 0, "Must record > 0");
        require(_donor != address(0), "Donor cannot be zero");

        // // For "Goal" or "PerPerson", do not exceed campaign.goal
        // if (
        //     campaign.campaignType == CampaignType.Goal ||
        //     campaign.campaignType == CampaignType.PerPerson
        // ) {
        //     require(
        //         campaign.balance + _amount <= campaign.goal,
        //         "Donation exceeds goal"
        //     );
        // }

        // if (campaign.campaignType == CampaignType.PerPerson) {
        //     // Each donor must pay at least goal / maxDonors
        //     uint256 costPerPerson = campaign.goal / campaign.maxDonors;
        //     require(_amount >= costPerPerson, "Below required share");
        //     require(campaign.numDonors < campaign.maxDonors, "Max donors reached");
        // } 
        // else if (campaign.campaignType == CampaignType.SplitFixedCost) {
        //     require(campaign.numDonors < campaign.maxDonors, "Max donors reached");
        //     uint256 costPerPerson = campaign.goal / campaign.maxDonors;
        //     require(_amount >= costPerPerson, "Below your split share");
        //     // Optionally forbid multiple pledges from same donor
        //     require(
        //         campaignDonations[_campaignId][_donor] == 0,
        //         "Donor already pledged"
        //     );
        // }

        // Update campaign balance
        campaign.balance += _amount;

        // If donor is new, increment donor count and store them
        if (campaignDonations[_campaignId][_donor] == 0) {
            campaign.numDonors++;
            campaign.donors.push(_donor);
        }

        campaignDonations[_campaignId][_donor] += _amount;
        campaign.numDonations++;
    }

    // ------------------------------------------------------------------------
    // End Campaign (Payout or Refund)
    // ------------------------------------------------------------------------
    /**
     * @notice Once deadline is reached, finalize the campaign:
     *         - If "tips," pay out minus fee.
     *         - Otherwise, refund donors.
     */
    function handleCampaignEnd(uint256 _campaignId) external {
        require(_campaignId < campaignCount, "Invalid campaignId");
        Campaign storage campaign = campaigns[_campaignId];

        require(campaign.isActive, "Campaign ended");
        require(block.timestamp >= campaign.deadline, "Deadline not reached");

        if (campaign.campaignType == CampaignType.AnythingHelps) {
            // Always pays out
            _payoutAndClose(campaign);
        } 
        else if (campaign.campaignType == CampaignType.Goal) {
            // Must reach >= goal
            if (campaign.balance >= campaign.goal) {
                _payoutAndClose(campaign);
            } else {
                _refundAndClose(campaign);
            }
        }
        else if (campaign.campaignType == CampaignType.PerPerson) {
            // Must have exactly maxDonors
            if (campaign.numDonors == campaign.maxDonors) {
                _payoutAndClose(campaign);
            } else {
                _refundAndClose(campaign);
            }
        }
        else if (campaign.campaignType == CampaignType.SplitFixedCost) {
            // Must reach or exceed 'goal'
            if (campaign.balance >= campaign.goal) {
                _payoutAndClose(campaign);
            } else {
                _refundAndClose(campaign);
            }
        }
    }

    /**
     * @notice Force refunds if needed. Possibly used to end early or if
     *         the campaign obviously won't meet requirements before deadline.
     */
    function refundDonors(uint256 _campaignId) external {
        require(_campaignId < campaignCount, "Invalid campaignId");
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign ended");

        _refundAndClose(campaign);
    }

    // ------------------------------------------------------------------------
    // Internal Helpers
    // ------------------------------------------------------------------------
    /**
     * @dev Pay out to recipient minus fee, then end the campaign.
     */
    function _payoutAndClose(Campaign storage _campaign) internal {
        uint256 total = _campaign.balance;
        uint256 feeAmount = (total * feeBps) / 1000; // e.g. 1.5% if feeBps=15
        IERC20 token = IERC20(_campaign.token);

        // Transfer fee
        require(token.transfer(owner, feeAmount), "Fee transfer failed");
        // Transfer remainder
        require(token.transfer(_campaign.recipient, total - feeAmount), "Payout failed");

        _campaign.isActive = false;
        _campaign.balance = 0;
    }

    /**
     * @dev Refund each donor's recorded donation, then end the campaign.
     */
    function _refundAndClose(Campaign storage _campaign) internal {
        uint256 cId = _campaign.id;
        IERC20 token = IERC20(_campaign.token);

        for (uint256 i = 0; i < _campaign.donors.length; i++) {
            address donor = _campaign.donors[i];
            uint256 donated = campaignDonations[cId][donor];
            if (donated > 0) {
                campaignDonations[cId][donor] = 0; 
                require(token.transfer(donor, donated), "Refund failed");
            }
        }
        _campaign.isActive = false;
        _campaign.balance = 0;
    }

    // ------------------------------------------------------------------------
    // View Functions
    // ------------------------------------------------------------------------
    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
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
