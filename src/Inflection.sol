pragma solidity ^0.8.13;

/**
 * @title Inflection
 * @notice A contract for running "inflection" style group funding campaigns
 *         with four different campaign types:
 *         1) AnythingHelps    - No minimum; any amount tips automatically at deadline
 *         2) Goal (MakeOrBreak) - Must reach a total funding goal
 *         3) PerPerson (Fixed Price) - Must get all X contributors paying a fixed amount
 *         4) SplitFixedCost   - A total cost is split equally among up to maxDonors
 *
 * Contributors only pay if the campaign "tips." Otherwise, they get a refund.
 * A 1.5% fee is collected by the contract owner on campaigns that tip.
 */
contract Inflection {
    // --------------------------
    // ENUMS & STRUCTS
    // --------------------------

    enum CampaignType {
        AnythingHelps,   // Tips automatically at deadline (no minimum)
        Goal,            // Must reach a total goal or refund
        PerPerson,       // Must have maxDonors each paying a fixed share
        SplitFixedCost   // A fixed cost to split among up to maxDonors
    }

    struct Campaign {
        uint256 id;               // Unique ID
        CampaignType campaignType; // Which type of campaign
        bool isActive;            // Whether campaign is still active
        string name;              // Name of the campaign
        string image;             // (Optional) image link
        string description;       // Short description
        uint256 balance;          // Amount of ETH currently raised
        uint256 deadline;         // Unix timestamp of campaign deadline
        uint256 numDonors;        // Number of unique donors (addresses)
        address[] donors;         // List of unique donor addresses
        uint256 goal;             // Funding goal (used for Goal / SplitFixedCost)
        uint256 maxDonors;        // For PerPerson / SplitFixedCost
        address recipient;        // Recipient of the funds if campaign tips
        uint256 numDonations;     // Number of donation transactions
    }

    // --------------------------
    // STATE VARIABLES
    // --------------------------

    address public owner;
    uint256 private campaignCount;
    Campaign[] private campaigns;

    // Mapping: campaign ID -> (donor address -> amount donated)
    mapping(uint256 => mapping(address => uint256)) public campaignDonations;

    // Fee set to 1.5% by default (15 basis points = 15/1000)
    uint256 public feeBps = 15;

    // --------------------------
    // MODIFIERS & CONSTRUCTOR
    // --------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // --------------------------
    // OWNER FUNCTIONS
    // --------------------------

    /**
     * @notice Allows the owner to update the fee in basis points
     * @param _feeBps Fee in basis points (e.g., 15 => 1.5%)
     */
    function setFee(uint256 _feeBps) external onlyOwner {
        feeBps = _feeBps;
    }

    /**
     * @notice Delete a campaign by ID (onlyOwner). It sets the struct to the "default" value.
     * @dev    This does not fully remove it from the array but zeroes it out.
     */
    function deleteCampaign(uint256 _campaignId) external onlyOwner {
        require(_campaignId < campaignCount, "Campaign does not exist");
        delete campaigns[_campaignId];
    }

    // --------------------------
    // CAMPAIGN CREATION
    // --------------------------

    /**
     * @notice Create a new campaign
     * @param _campaignType Enum specifying the campaign style
     * @param _name A short name for the campaign
     * @param _image Optional image link or IPFS hash
     * @param _description Short description
     * @param _recipient Address that receives funds if campaign tips
     * @param _goal The total funding goal (used in certain campaign types)
     * @param _deadline Unix timestamp after which the campaign ends
     * @param _maxDonors The maximum number of donors (for PerPerson / SplitFixedCost)
     */
    function createCampaign(
        CampaignType _campaignType,
        string calldata _name,
        string calldata _image,
        string calldata _description,
        address _recipient,
        uint256 _goal,
        uint256 _deadline,
        uint256 _maxDonors
    ) external {
        require(_deadline > block.timestamp, "Deadline must be in future");
        require(_goal > 0, "Goal must be > 0");
        require(_recipient != address(0), "Recipient cannot be zero address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        if (_campaignType == CampaignType.PerPerson || _campaignType == CampaignType.SplitFixedCost) {
            require(_maxDonors > 0, "maxDonors must be > 0");
        }

        Campaign memory newCampaign = Campaign({
            id: campaignCount,
            campaignType: _campaignType,
            isActive: true,
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

    // --------------------------
    // DONATIONS
    // --------------------------

    /**
     * @notice Contribute to a campaign by sending ETH.
     * @dev    Make sure to set msg.value in your transaction.
     * @param _campaignId ID of the campaign to donate to
     */
    function donate(uint256 _campaignId) external payable {
        require(_campaignId < campaignCount, "Campaign does not exist");
        require(msg.value > 0, "Must send > 0 ETH");

        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(block.timestamp < campaign.deadline, "Campaign deadline reached");

        // For "Goal" or "PerPerson" campaigns, do not allow going over the goal
        if (
            campaign.campaignType == CampaignType.Goal || 
            campaign.campaignType == CampaignType.PerPerson
        ) {
            require(
                campaign.balance + msg.value <= campaign.goal, 
                "Donation would exceed the campaign goal"
            );
        }

        if (campaign.campaignType == CampaignType.PerPerson) {
            // Each donor must pay at least goal/maxDonors
            uint256 costPerPerson = campaign.goal / campaign.maxDonors;
            require(msg.value >= costPerPerson, "Must send at least the per-person cost");
            require(campaign.numDonors < campaign.maxDonors, "Max donors reached");
        } else if (campaign.campaignType == CampaignType.SplitFixedCost) {
            // Similar constraint: each donor should pay at least goal/maxDonors
            require(campaign.numDonors < campaign.maxDonors, "Max donors reached");
            uint256 costPerPerson = campaign.goal / campaign.maxDonors;
            require(msg.value >= costPerPerson, "Not enough to cover your share");
            // Ensure the same donor doesn't pledge multiple times
            require(campaignDonations[_campaignId][msg.sender] == 0, "Already pledged");
        }

        // Update campaign state
        campaign.balance += msg.value;

        // If this is the first time this donor has donated to this campaign
        if (campaignDonations[_campaignId][msg.sender] == 0) {
            campaign.numDonors++;
            campaign.donors.push(msg.sender);
        }

        campaignDonations[_campaignId][msg.sender] += msg.value;
        campaign.numDonations++;
    }

    // --------------------------
    // ENDING / REFUNDING
    // --------------------------

    /**
     * @notice Handle finalizing the campaign after its deadline. 
     *         Transfers funds to the recipient if it "tipped"; otherwise refunds donors.
     * @param _campaignId Campaign ID to finalize
     */
    function handleCampaignEnd(uint256 _campaignId) external {
        require(_campaignId < campaignCount, "Campaign does not exist");

        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign already finalized");
        require(block.timestamp >= campaign.deadline, "Deadline not reached yet");

        // If the campaign tips, we send the funds (minus fee) to recipient.
        // Otherwise, we refund donors. Then we set isActive = false.
        if (campaign.campaignType == CampaignType.AnythingHelps) {
            // Always tips at the end
            _payoutAndClose(campaign);
        } 
        else if (campaign.campaignType == CampaignType.Goal) {
            // Must meet or exceed the goal
            if (campaign.balance >= campaign.goal) {
                _payoutAndClose(campaign);
            } else {
                _refundAndClose(campaign);
            }
        }
        else if (campaign.campaignType == CampaignType.PerPerson) {
            // Must have all maxDonors contributing
            if (campaign.numDonors == campaign.maxDonors) {
                _payoutAndClose(campaign);
            } else {
                _refundAndClose(campaign);
            }
        }
        else if (campaign.campaignType == CampaignType.SplitFixedCost) {
            // Must meet or exceed total cost
            if (campaign.balance >= campaign.goal) {
                _payoutAndClose(campaign);
            } else {
                _refundAndClose(campaign);
            }
        }
    }

    /**
     * @notice Refund all donors in a campaign, if it fails.
     * @dev    This can be called directly or from handleCampaignEnd().
     * @param _campaignId The campaign ID to refund
     */
    function refundDonors(uint256 _campaignId) external {
        require(_campaignId < campaignCount, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign already ended");

        _refundAndClose(campaign);
    }

    // --------------------------
    // INTERNAL HELPERS
    // --------------------------

    /**
     * @dev Sends full campaign.balance to the recipient minus the fee,
     *      and marks the campaign as ended.
     */
    function _payoutAndClose(Campaign storage campaign) internal {
        uint256 total = campaign.balance;
        // fee = total * feeBps / 1000
        uint256 feeAmount = (total * feeBps) / 1000;

        // Send fee to owner
        payable(owner).transfer(feeAmount);
        // Send remainder to recipient
        payable(campaign.recipient).transfer(total - feeAmount);

        // Mark campaign as ended
        campaign.isActive = false;
        campaign.balance = 0;
    }

    /**
     * @dev Refund each donor the exact amount they contributed,
     *      then close the campaign.
     */
    function _refundAndClose(Campaign storage campaign) internal {
        for (uint256 i = 0; i < campaign.donors.length; i++) {
            address donor = campaign.donors[i];
            uint256 amount = campaignDonations[campaign.id][donor];
            if (amount > 0) {
                campaignDonations[campaign.id][donor] = 0;
                payable(donor).transfer(amount);
            }
        }
        campaign.isActive = false;
        campaign.balance = 0;
    }

    // --------------------------
    // VIEW FUNCTIONS
    // --------------------------

    /**
     * @notice Get details of a specific campaign by ID
     */
    function getCampaign(uint256 _campaignId)
        external
        view
        returns (Campaign memory)
    {
        require(_campaignId < campaignCount, "Campaign does not exist");
        return campaigns[_campaignId];
    }

    /**
     * @notice Returns the entire array of campaigns
     */
    function getAllCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }

    /**
     * @notice Returns total count of created campaigns
     */
    function getCampaignCount() external view returns (uint256) {
        return campaignCount;
    }
}