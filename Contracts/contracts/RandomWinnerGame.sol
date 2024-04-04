// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol';

contract RandomWinnerGame is VRFConsumerBase,Ownable(msg.sender){

    address[] public players;

    uint256 fee;

    uint256 public entryFee;

    bytes32 public keyHash;

    uint8 maxPlayers;

    bool public gameStarted;

    uint256 public gameId;

    event GameStarted(uint8 maxPlayers,uint256 entryFee,uint256 gameId);
    event PlayerJoined(uint256 gameId, address player);
    event GameEnded(uint256 gameId, address winner, bytes32 requestId);

    constructor(address vrfCoordinator, address linkToken, uint256 vrfFee, bytes32 vrfKeyHash ) VRFConsumerBase(vrfCoordinator,linkToken) {
            keyHash = vrfKeyHash;
            fee = vrfFee;
            gameStarted = false;
    }

    function startGame(uint8 _maxPlayers,uint256 _entryFee) public onlyOwner {
        require(!gameStarted,"Game already started and is running");
        require(_maxPlayers>0,"You cannot create a game with zero players");
        delete players;
        maxPlayers = _maxPlayers;
        gameStarted = true;
        gameId+=1;
        entryFee = _entryFee;
        emit GameStarted(maxPlayers,entryFee,gameId);
    }

    function joinGame() public payable{
        require(gameStarted,"Game has not started..!");
        require(msg.value>=entryFee,"Ether sent is invalid");
        require(players.length < maxPlayers,"players Limit reached");
        players.push(msg.sender);
        emit PlayerJoined(gameId,msg.sender);
        if(players.length == maxPlayers){
            getRandomWinner();
        }
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness)internal virtual override{
        uint256 winnerIndex = randomness%players.length;
        address winner = players[winnerIndex];
        (bool sent,) = winner.call{value : address(this).balance}("");
        require(sent, "Failed to send ether");
        emit GameEnded(gameId, winner, requestId);
        gameStarted = false;
    }

    function getRandomWinner() private returns(bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee ,"Not enough LINK");
        return requestRandomness(keyHash, fee);
    }

    receive() external payable{}

    fallback() external payable{}
    

}