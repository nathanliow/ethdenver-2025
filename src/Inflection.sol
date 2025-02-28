// pragma solidity ^0.8.13;

// // If your Chainlink version uses "AutomationCompatible" instead of "KeeperCompatible",
// // update the import as needed:
// import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

// /**
//  * @title Inflection (Stablecoin-Only, No donate() Function)
//  * @notice A "inflection" style crowdfunding contract that:
//  *         1. Only accepts ERC20 stablecoins (no ETH).
//  *         2. Has four campaign types: AnythingHelps, Goal, PerPerson, SplitFixedCost.
//  *         3. Uses a 1.5% (configurable) fee on successful campaigns.
//  *         4. Does NOT actively transferFrom donors. Instead, donors must
//  *            transfer tokens externally, then call updateCampaign() to record that deposit.
//  *
//  * Usage Flow:
//  *  1) Deploy contract.
//  *  2) createCampaign(...) with a stablecoin address and desired parameters.
//  *  3) Donor sends tokens directly to this contract (e.g., token.transfer(address(this), amount)).
//  *  4) Then call updateCampaign(campaignId, amount, donor) to associate that deposit.
//  *  5) After deadline, call handleCampaignEnd(...) to finalize (payout or refund).
//  */

// interface IERC20 {
//     function transfer(address recipient, uint256 amount) external returns (bool);
// }

// contract Inflection is AutomationCompatibleInterface {
//     // ------------------------------------------------------------------------
//     // Enums & Data Structures
//     // ------------------------------------------------------------------------
//     enum CampaignType {
//         AnythingHelps,   // Tips automatically at deadline (no minimum)
//         Goal,            // Must reach or exceed 'goal' total
//         PerPerson,       // Must have exactly maxDonors each paying >= cost share
//         SplitFixedCost   // Must reach 'goal'; each paying >= goal/maxDonors
//     }

//     struct Campaign {
//         uint256 id;               // Unique ID
//         CampaignType campaignType; // Which type
//         bool isActive;            // Whether campaign is still active
//         address token;            // ERC20 token used for donations
//         string name;              // Name/title
//         string image;             // Optional image link
//         string description;       // Short description
//         uint256 balance;          // Tracked total of contributions
//         uint256 deadline;         // Unix timestamp (end time)
//         uint256 numDonors;        // Number of unique donors
//         address[] donors;         // List of donor addresses
//         uint256 goal;             // For Goal, SplitFixedCost, etc.
//         uint256 maxDonors;        // For PerPerson, SplitFixedCost
//         address recipient;        // Address receiving funds on success
//         uint256 numDonations;     // Number of updateCampaign() calls
//     }

//     // ------------------------------------------------------------------------
//     // State Variables
//     // ------------------------------------------------------------------------
//     address public owner;          // Contract owner (fee collector)
//     uint256 private campaignCount; // Count of campaigns created
//     Campaign[] private campaigns;  // Array of all campaigns

//     // Mapping: campaignId -> donor -> amount
//     mapping(uint256 => mapping(address => uint256)) public campaignDonations;

//     // Fee in basis points; default 15 => 1.5%
//     uint256 public feeBps = 15;

//     // Whitelist: Only certain tokens are allowed
//     mapping(address => bool) public whitelistedTokens;

//     // ------------------------------------------------------------------------
//     // Modifiers & Constructor
//     // ------------------------------------------------------------------------
//     modifier onlyOwner() {
//         require(msg.sender == owner, "Only owner");
//         _;
//     }

//     constructor() {
//         owner = msg.sender;

//         // Example: Whitelist RLUSD and USDC
//         whitelistedTokens[0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD] = true; // RLUSD (example)
//         whitelistedTokens[0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48] = true; // USDC mainnet
//     }

//     // ------------------------------------------------------------------------
//     // Chainlink Automation (checkUpkeep / performUpkeep)
//     // ------------------------------------------------------------------------

//     /**
//      * @notice Called by Chainlink nodes off-chain. We must decide if upkeep is needed.
//      */
//     function checkUpkeep(bytes calldata)
//         external
//         view
//         override
//         returns (bool upkeepNeeded, bytes memory performData)
//     {
//         uint256[] memory overdueIds = new uint256[](campaignCount);
//         uint256 idx = 0;

//         for (uint256 i = 0; i < campaignCount; i++) {
//             Campaign storage c = campaigns[i];
//             // If active & deadline passed
//             if (c.isActive && block.timestamp >= c.deadline) {
//                 overdueIds[idx] = i;
//                 idx++;
//             }
//         }

//         if (idx > 0) {
//             upkeepNeeded = true;
//             // Slice array to relevant portion
//             overdueIds = sliceArray(overdueIds, idx);
//             performData = abi.encode(overdueIds);
//         } else {
//             upkeepNeeded = false;
//             performData = "";
//         }
//     }

//     /**
//      * @notice Called by Chainlink on-chain if checkUpkeep returns true.
//      * @dev We decode which campaigns are overdue and end them.
//      */
//     function performUpkeep(bytes calldata performData) external override {
//         uint256[] memory overdueIds = abi.decode(performData, (uint256[]));
//         for (uint256 i = 0; i < overdueIds.length; i++) {
//             uint256 cid = overdueIds[i];
//             // Double-check
//             if (cid < campaignCount) {
//                 Campaign storage c = campaigns[cid];
//                 if (c.isActive && block.timestamp >= c.deadline) {
//                     handleCampaignEnd(cid);
//                 }
//             }
//         }
//     }

//     /**
//      * @dev Helper to slice an array down to `length`.
//      */
//     function sliceArray(uint256[] memory array, uint256 length)
//         internal
//         pure
//         returns (uint256[] memory)
//     {
//         uint256[] memory trimmed = new uint256[](length);
//         for (uint256 i = 0; i < length; i++) {
//             trimmed[i] = array[i];
//         }
//         return trimmed;
//     }

//     // ------------------------------------------------------------------------
//     // Owner Functions
//     // ------------------------------------------------------------------------

//     /**
//      * @notice Adjust fee in basis points. e.g., 15 => 1.5%, 100 => 10%, etc.
//      */
//     function setFee(uint256 _feeBps) external onlyOwner {
//         feeBps = _feeBps;
//     }

//     /**
//      * @notice Delete a campaign by ID, clearing its data (dev feature).
//      * @dev    This doesn't remove the array index, but zeroes out the struct.
//      */
//     function deleteCampaign(uint256 _campaignId) external onlyOwner {
//         require(_campaignId < campaignCount, "Invalid campaignId");
//         delete campaigns[_campaignId];
//     }

//     /**
//      * @notice Owner can whitelist or blacklist tokens.
//      */
//     function setTokenWhitelisted(address _token, bool _isWhitelisted)
//         external
//         onlyOwner
//     {
//         whitelistedTokens[_token] = _isWhitelisted;
//     }

//     // ------------------------------------------------------------------------
//     // Campaign Creation
//     // ------------------------------------------------------------------------

//     /**
//      * @dev Create a new campaign. Must specify a whitelisted (nonzero) ERC20 token.
//      */
//     function createCampaign(
//         address _token,
//         CampaignType _campaignType,
//         string calldata _name,
//         string calldata _image,
//         string calldata _description,
//         address _recipient,
//         uint256 _goal,
//         uint256 _deadline,
//         uint256 _maxDonors
//     ) external {
//         require(_token != address(0), "Token=0");
//         require(whitelistedTokens[_token], "Token not whitelisted");
//         require(bytes(_name).length > 0, "Name required");
//         require(bytes(_description).length > 0, "Description required");
//         require(_recipient != address(0), "Recipient=0");
//         require(_deadline > block.timestamp, "Deadline must be future");
//         require(_goal > 0, "Goal>0");

//         if (
//             _campaignType == CampaignType.PerPerson ||
//             _campaignType == CampaignType.SplitFixedCost
//         ) {
//             require(_maxDonors > 0, "maxDonors>0");
//         }

//         Campaign memory newC = Campaign({
//             id: campaignCount,
//             campaignType: _campaignType,
//             isActive: true,
//             token: _token,
//             name: _name,
//             image: _image,
//             description: _description,
//             balance: 0,
//             deadline: _deadline,
//             numDonors: 0,
//             donors: new address[](0),
//             goal: _goal,
//             maxDonors: _maxDonors,
//             recipient: _recipient,
//             numDonations: 0
//         });

//         campaigns.push(newC);
//         campaignCount++;
//     }

//     // ------------------------------------------------------------------------
//     // Update / Record a Donation (No Token Transfer)
//     // ------------------------------------------------------------------------

//     /**
//      * @notice Update the campaign's balance and donor count to reflect an external token deposit.
//      *         The user must have already transferred tokens to `address(this)`.
//      * @param _campaignId ID of the campaign
//      * @param _amount Amount of tokens (in smallest units) contributed
//      * @param _donor Address that made the off-chain transfer
//      */
//     function updateCampaign(
//         uint256 _campaignId,
//         uint256 _amount,
//         address _donor
//     ) external {
//         require(_campaignId < campaignCount, "Invalid campaignId");
//         Campaign storage c = campaigns[_campaignId];
//         require(c.isActive, "Campaign ended");
//         require(block.timestamp < c.deadline, "Deadline passed");
//         require(_amount > 0, "Amount>0");
//         require(_donor != address(0), "Donor=0");

//         // Example checks (commented out since your logic might vary):
//         // if (
//         //     c.campaignType == CampaignType.Goal ||
//         //     c.campaignType == CampaignType.PerPerson
//         // ) {
//         //     require(c.balance + _amount <= c.goal, "Exceeds goal");
//         // }

//         // if (c.campaignType == CampaignType.PerPerson) {
//         //     uint256 costPerPerson = c.goal / c.maxDonors;
//         //     require(_amount >= costPerPerson, "Below share");
//         // }

//         c.balance += _amount;
//         if (campaignDonations[_campaignId][_donor] == 0) {
//             c.numDonors++;
//             c.donors.push(_donor);
//         }
//         campaignDonations[_campaignId][_donor] += _amount;
//         c.numDonations++;
//     }

//     // ------------------------------------------------------------------------
//     // End Campaign (Payout or Refund)
//     // ------------------------------------------------------------------------

//     /**
//      * @notice End a campaign after its deadline. If it "tips," pay out minus fee, else refund donors.
//      */
//     function handleCampaignEnd(uint256 _campaignId) public {
//         require(_campaignId < campaignCount, "Invalid campaignId");
//         Campaign storage c = campaigns[_campaignId];
//         require(c.isActive, "Already ended");
//         require(block.timestamp >= c.deadline, "Not yet due");

//         if (c.campaignType == CampaignType.AnythingHelps) {
//             // Always pays out
//             _payoutAndClose(c);
//         }
//         else if (c.campaignType == CampaignType.Goal) {
//             if (c.balance >= c.goal) {
//                 _payoutAndClose(c);
//             } else {
//                 _refundAndClose(c);
//             }
//         }
//         else if (c.campaignType == CampaignType.PerPerson) {
//             // Must have exactly maxDonors
//             if (c.numDonors == c.maxDonors) {
//                 _payoutAndClose(c);
//             } else {
//                 _refundAndClose(c);
//             }
//         }
//         else if (c.campaignType == CampaignType.SplitFixedCost) {
//             if (c.balance >= c.goal) {
//                 _payoutAndClose(c);
//             } else {
//                 _refundAndClose(c);
//             }
//         }
//     }

//     /**
//      * @notice Force refunds if needed. Possibly used to end early if you want.
//      */
//     function refundDonors(uint256 _campaignId) external {
//         require(_campaignId < campaignCount, "Invalid campaignId");
//         Campaign storage c = campaigns[_campaignId];
//         require(c.isActive, "Ended");
//         _refundAndClose(c);
//     }

//     // ------------------------------------------------------------------------
//     // Internal Helpers
//     // ------------------------------------------------------------------------

//     /**
//      * @dev Pay out to recipient minus fee, then end the campaign.
//      */
//     function _payoutAndClose(Campaign storage c) internal {
//         uint256 total = c.balance;
//         uint256 feeAmount = (total * feeBps) / 1000; // e.g. 1.5% if feeBps=15
//         IERC20 token = IERC20(c.token);

//         require(token.transfer(owner, feeAmount), "Fee transfer failed");
//         require(token.transfer(c.recipient, total - feeAmount), "Payout failed");

//         c.isActive = false;
//         c.balance = 0;
//     }

//     /**
//      * @dev Refund each donor's recorded donation, then end the campaign.
//      */
//     function _refundAndClose(Campaign storage c) internal {
//         uint256 cid = c.id;
//         IERC20 token = IERC20(c.token);

//         for (uint256 i = 0; i < c.donors.length; i++) {
//             address donor = c.donors[i];
//             uint256 donated = campaignDonations[cid][donor];
//             if (donated > 0) {
//                 campaignDonations[cid][donor] = 0;
//                 require(token.transfer(donor, donated), "Refund failed");
//             }
//         }
//         c.isActive = false;
//         c.balance = 0;
//     }

//     // ------------------------------------------------------------------------
//     // View Functions
//     // ------------------------------------------------------------------------

//     function getCampaign(uint256 _campaignId)
//         external
//         view
//         returns (Campaign memory)
//     {
//         require(_campaignId < campaignCount, "Invalid campaignId");
//         return campaigns[_campaignId];
//     }

//     function getAllCampaigns() external view returns (Campaign[] memory) {
//         return campaigns;
//     }

//     function getCampaignCount() external view returns (uint256) {
//         return campaignCount;
//     }
// }

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
    function transfer(address recipient, uint256 amount) external returns (bool);
    // We'll also need transferFrom for the SplitFixedCost mechanic:
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract Inflection is AutomationCompatibleInterface {
    // ------------------------------------------------------------------------
    // Enums & Data Structures
    // ------------------------------------------------------------------------
    enum CampaignType {
        AnythingHelps,   // Tips automatically at deadline (no minimum)
        Goal,            // Must reach or exceed 'goal'
        PerPerson,       // Must have exactly maxDonors each paying >= cost
        SplitFixedCost   // Must raise 'goal' by charging pledgers at the end
    }

    struct Campaign {
        uint256 id;
        CampaignType campaignType;
        bool isActive;
        address token;            // ERC20 stablecoin
        string name;
        string image;
        string description;
        uint256 balance;          // total tokens credited so far
        uint256 deadline;
        uint256 numDonors;        // how many donors or pledgers
        address[] donors;         // list of donors or pledgers
        uint256 goal;
        uint256 maxDonors;        // used in PerPerson or SplitFixedCost
        address recipient;
        uint256 numDonations;     // how many calls to updateCampaign or pledge
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
        whitelistedTokens[0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD] = true; // RLUSD
        whitelistedTokens[0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48] = true; // USDC
    }

    // ------------------------------------------------------------------------
    // Chainlink Automation
    // ------------------------------------------------------------------------
    function checkUpkeep(bytes calldata)
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

    function sliceArray(uint256[] memory array, uint256 length)
        internal
        pure
        returns (uint256[] memory)
    {
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

    function setTokenWhitelisted(address _token, bool _isWhitelisted) external onlyOwner {
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

        if (_campaignType == CampaignType.PerPerson || _campaignType == CampaignType.SplitFixedCost) {
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
            numDonors: 0,
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

        // For "SplitFixedCost" below, we do NOT deposit tokens here. So skip if it's that type:
        require(c.campaignType != CampaignType.SplitFixedCost, "Use pledgeSplitFixedCost");

        // Increase the campaign's recorded balance
        c.balance += _amount;

        // If new donor, record them
        if (campaignDonations[_campaignId][_donor] == 0) {
            c.numDonors++;
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
    function pledgeSplitFixedCost(uint256 _campaignId) external {
        Campaign storage c = campaigns[_campaignId];
        require(c.isActive, "Ended");
        require(block.timestamp < c.deadline, "Deadline passed");
        require(c.campaignType == CampaignType.SplitFixedCost, "Not SplitFixedCost");
        require(!splitPledges[_campaignId][msg.sender], "Already pledged");
        require(c.numDonors < c.maxDonors, "Max pledgers reached");

        // Mark the pledger
        splitPledges[_campaignId][msg.sender] = true;
        c.numDonors++;
        c.donors.push(msg.sender);
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

        if (c.campaignType == CampaignType.AnythingHelps) {
            // Always pays out
            _payoutAndClose(c);
        }
        else if (c.campaignType == CampaignType.Goal) {
            // Must reach or exceed goal
            if (c.balance >= c.goal) {
                _payoutAndClose(c);
            } else {
                _refundAndClose(c);
            }
        }
        else if (c.campaignType == CampaignType.PerPerson) {
            // Must have exactly maxDonors
            if (c.numDonors == c.maxDonors) {
                _payoutAndClose(c);
            } else {
                _refundAndClose(c);
            }
        }
        else if (c.campaignType == CampaignType.SplitFixedCost) {
            // We do the new "pledging" approach:
            _handleSplitFixedCostEnd(c);
        }
    }

    /**
     * @dev If we have enough pledgers, each must pay goal/pledgerCount. We attempt
     *      transferFrom(...) from each pledger. If any fail, we revert => campaign fails.
     */
    function _handleSplitFixedCostEnd(Campaign storage c) internal {
        uint256 pledgerCount = c.numDonors;
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
                bool success = token.transferFrom(pledger, address(this), costPerPerson);
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
        require(token.transfer(c.recipient, total - feeAmount), "Payout failed");

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
    function getCampaign(uint256 _campaignId)
        external
        view
        returns (Campaign memory)
    {
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
