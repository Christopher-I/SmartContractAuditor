pragma solidity >=0.4.21 <0.6.0;

contract sampleContract {
  address public owner;
  uint public last_completed_migration;

  constructor() public {
    owner = msg.sender;

  }

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  function testFunction1(){
    //function() payable internal
    //.call.value()
  
  }

  function setCompleted(uint completed) public payable  {
    last_completed_migration = completed;

  }

}
