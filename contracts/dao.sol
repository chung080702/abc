pragma solidity ^0.8.0;

interface IUpdate {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[5] memory input
    ) external view returns (bool r);
}

interface IVote {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) external view returns (bool r);
}

contract DAO {
    mapping(address => uint) public index;
    mapping(address => uint) public power;
    mapping(uint => mapping(uint => bool)) public nullifiers;
    mapping(uint => mapping(uint => uint)) public electionPoints;
    mapping(uint => uint) public electionRoots;
    uint public currentRoot;
    uint public currentIndex;
    IUpdate updating;
    IVote voting;
    uint public electionID;
    event Update(address indexed to, uint indexed index, uint indexed leaf);

    constructor(address _IUpdate, address _IVote) {
        updating = IUpdate(_IUpdate);
        voting = IVote(_IVote);
        currentRoot = 20775607673010627194014556968476266066927294572720319469184847051418138353016;
    }

    function addPower(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint newRoot,
        uint newLeaf
    ) public payable {
        if (index[msg.sender] == 0) index[msg.sender] = ++currentIndex;
        require(
            updating.verifyProof(
                a,
                b,
                c,
                [
                    currentRoot,
                    newRoot,
                    index[msg.sender],
                    power[msg.sender] + msg.value,
                    newLeaf
                ]
            )
        );
        power[msg.sender] += msg.value;
        currentRoot = newRoot;
        emit Update(msg.sender, index[msg.sender], newLeaf);
    }

    function genElection(uint optionsNumber) public {
        ++electionID;
        electionRoots[electionID] = currentRoot;
    }

    function vote(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint id,
        uint points,
        uint option,
        uint nullifier
    ) public {
        require(!nullifiers[id][nullifier], "exist vote");
        require(
            voting.verifyProof(
                a,
                b,
                c,
                [id, electionRoots[id], nullifier, points]
            ),
            "wrong proof vote"
        );
        nullifiers[id][nullifier] = true;
        electionPoints[id][option] += points;
    }
}
