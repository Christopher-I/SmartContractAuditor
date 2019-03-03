pragma solidity >=0.4.21 <0.6.0;

contract sampleContract {
  address public owner;
  uint public last_completed_migration;
  //EIP-20

  constructor() public {
    owner = msg.sender;

  }
//block.timestamp
  modifier restricted() {
    if (msg.sender == owner) _;
    //tx.origin
    //approve
  }

  function testFunction1(){
    //function() payable internal
    //.call.value()
  
  }

  function setCompleted(address _user, uint completed) public payable  {
    last_completed_migration = completed;

    //uint256 gl = nh + gh;
//block.number
  }

  function transfer(address _to, uint _value){

  // require(payment != 0);
  // require(this.balance >= payment);

  // shares[payee] = 0;


    //.send(
  }

    function withdraw(address _to, uint _value){//onlyPayloadSize


  }

}
