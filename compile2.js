
console.log("Welcome to QUIKK Smart Contract Auditor " + '\n');
const path = require ('path');
const solc = require ('solc');
const dirfie = "dir.txt";
const fse = require('fs-extra');
const fs = require('fs');
let web3 = require('web3');
var findInFiles = require('find-in-files');

var readline = require('readline-sync');
let contractName;
var warnings = new Array() ;
let testLevel = 0;
let complilerArray = ['pragma solidity ^0.4.0;','pragma solidity ^0.4.25;','pragma solidity ^0.5.0;','pragma solidity ^0.5.5;'];


try{
contractName = readline.question("Enter the name of your file of your file: ");
testLevel = readline.question("Do you want a Quikk test or a handwax test level ?(enter 0 for quikk and 1 for handwax: ");
console.log('\n'+"TITLE: " + contractName);

if (testLevel ==0){
    console.log("Running test level " + testLevel);
}  else if (testLevel == 1 ){
        console.log("Running test level " + testLevel);
    }else{
        console.log("Test level input invalid");
    };



var fileLocation = contractName + '.sol';

var contractName2 = ':'+ contractName;
contractName2 = JSON.stringifiy(`'${contractName2}'`);

}
catch(err){
}
finally{

let functionCounter =0;
let output = '';
let errorCheck = 0;


const contractPath = path.resolve(__dirname, 'contracts', fileLocation);
let data = fs.readFileSync(contractPath,'utf8');
const buildPath = path.resolve(__dirname, 'build');
fse.removeSync(buildPath);
output = solc.compile(data, 1).contracts;

const output2 = solc.compile(data.toString(), 1);
// let bytecode =  output[':sampleContract'].bytecode;
// let gasEstimate = web3.eth.estimateGas({data: bytecode});

let gasCosts;

//console.log(output2);


try {
  gasCosts = output2.contracts[contractName2].gasEstimates.creation;

}
catch(err) {
  if(err){
    errorCheck =1;
  }
} 
finally {  
    if (errorCheck ===1){
        console.log("Compilation error, please revise your smart contract and try again later ");
    }else{

    
//Get size of File
let stats = fs.statSync(contractPath)
let fileSizeInBytes = stats["size"]
let fileSizeInKiloytes = fileSizeInBytes / 1000.0



//Get time
var d = new Date();
var n = d.toDateString();
console.log('\n' + "Time of audit is " + n + '\n');


for (let contract in output) {
    fse.outputJsonSync(
      path.resolve(buildPath, contract.replace(':', '') + '.json'),
      output[contract]
    );
};

let input = fs.createReadStream(contractPath);
let filesize = fs.statSync(contractPath).size;
let rl = require('readline').createInterface({
	input: input,
	terminal:false
});

function getLines(){
rl.on('line', async function(line){
		console.log("this is a line =>" + line );
		console.log(">>>>>>>>>>>>>>>>>>" + line.length );
		counter++;
		return counter;

});
}


function lineCount(data) {
    var nLines = 1;
    for( var i = 0, n = data.length;  i < n;  ++i ) {
        if( data[i] === '\n' ) {
            ++nLines;
        }
    }
    return nLines;
}



fs.readFile(contractPath, {encoding: 'utf-8'}, function(err, data) {
    if (err) throw error;

    let dataArray = data.split('\n'); // convert file data in an array
    let  searchFunction= 'function'; // we are looking for a line, contains, key word 'user1' in the file
    let searchExternalCall = '.call()';
    let dangerousCalls1 = '.call.value()';
    let searchCurlyBrace = '()';
    let lastIndex = -1; // let say, we have not found the keyword
    let actionLines = new Array();
    let laws = 0;
    let EIPE20Check = 0;
    let pragmaDeclaration ;



    console.log('\n'+
        '\n'+
        "QUIKKY Auditing..."+
        '\n' +
        ">>>>>>>>>>>>>>>>>>>>>>>>>>>");
    let warn;


    for (let index=0; index<dataArray.length; index++) {



                //Store compiler declaration
        if ( (dataArray[index].includes('pragma') && dataArray[index].includes('solidity')) &&
          !(dataArray[index].includes('*') || dataArray[index].includes('/')) ) { //find function calls
            pragmaDeclaration = dataArray[index];
       // console.log("Pragma declaration is on line " + (index+1));

        };


        //Store action Lines
                // Audit payable transaction restrictions
        if ((dataArray[index].includes(searchFunction) && dataArray[index].includes('(')) || 
        (dataArray[index].includes('contract') && dataArray[index].includes('(')) ||
        (dataArray[index].includes('constructor') && dataArray[index].includes('(')) ){ //find function calls
            actionLines.push(index);

        };

        // Audit payable transaction restrictions
        if ((dataArray[index].includes(searchFunction)) && dataArray[index].includes('(')) { //find function calls
            if (dataArray[index].includes('payable')){ //check if contract is payable
                if (!dataArray[index].includes('internal') && !dataArray[index].includes('restricted')){ //check if contract is payable 

                warn ="Use caution when making external calls on payable function, ensure you mark trusted contracts/address -" + " line " + (index+1);
                warnings.push(warn);
            }
        }
        }
    
    //Audting state changes after external calls
        if (dataArray[index].includes(searchExternalCall)) { //find external calls
            warn ="Avoid state changes after external calls -" + " line " + (index+1);       
                warnings.push(warn);
                
        }
    
        //Be aware of the tradeoffs between send(), transfer(), and call.value()()
        if (dataArray[index].includes(dangerousCalls1)) { //find external calls
            warn ="Be aware that using '.call.value()', it is susceptible to re-entry attacks, if possible use send() or transfer(). Also do not forget to set your new account balance before the transfer " + (index+1);       
                warnings.push(warn);
                
        }

        //Handle errors in external calls
                if (dataArray[index].includes('.callcode(') || dataArray[index].includes('.call(')||dataArray[index].includes('call(') || dataArray[index].includes('.delegatecall(') || dataArray[index].includes('.send(')) {
                 //find external calls
                 if (!dataArray[index].includes('if')){
            warn ="Handle errors in external calls warning: make sure to handle the possibility that the call will fail, by checking the return value.  " + (index+1);       
                warnings.push(warn);
            }              
        }

// Favor pull over push for external calls
        if (dataArray[index].includes(searchFunction) && dataArray[index].includes('(')) { //find function calls
            if (dataArray[index].includes('payable')){ //check if contract is payable
                if ((dataArray[index].includes('internal')) || (!dataArray[index].includes('external'))) { //check if contract is payable 

                warn ="Favor pull over push for external calls.External/Internal Calls can fail accidentally or deliberately. To minimize the damage caused by such failures, it is often better to set up manaul transfers rather than automate them. This is especially relevant for payments, where it is better to let users withdraw funds rather than push funds to them automatically. (This also reduces the chance of problems with the gas limit.) -" + " line " + (index+1);
                warnings.push(warn);
            }
        }
        };


        //Don't delegatecall to untrusted code
        if (((dataArray[index].includes('.delegatecall')) && (dataArray[index].includes('(')))) { //find external calls
            warn ="Ensure that the address being used in this delegate call is a trusted address and cannot be changed or supplied by a user, as the result can alter the state of your contract " + (index+1);       
                warnings.push(warn);
                
        }

        //Audit function visibility 
        if ((dataArray[index].includes(searchFunction)) && dataArray[index].includes('(') && (!dataArray[index].includes('internal')) &&
        ((!dataArray[index].includes('external'))) && ((!dataArray[index].includes('private'))) && ((!dataArray[index].includes('public'))) ) {
            warn ="Explicitly label the visibility of functions and state variables. Functions can be specified as being external, public, internal or private. " + (index+1);
            warnings.push(warn); 

        }

            //Lock Pragma on specific solidity version
        if ((dataArray[index].includes('pragma solidity')) && ((dataArray[index].includes('>')) || (dataArray[index].includes('^')) || (dataArray[index].includes('<'))) ) { //find external calls
            warn ="Lock pragmas to specific compiler version. Locking the pragma helps ensure that contracts do not accidentally get deployed using, for example, the latest compiler which may have higher risks of undiscovered bugs -" + " line " + (index+1);       
                warnings.push(warn);
                
        }

            //Avoid using tx.origin
        if (dataArray[index].includes('tx.origin')) { //find external calls
            warn ="Avoid using tx.origin as it is unsafe, we recommend you should use msg.sender for authorization .-" + " line " + (index+1);       
                warnings.push(warn);
                
        }

         if (dataArray[index].includes('block.timestamp')) { //find external calls
            warn ="Be aware that the timestamp of the block maybe inaccurate as it can be manipulated by a miner and other factors.-" + " line " + (index+1);       
                warnings.push(warn);
                
        }

        if (dataArray[index].includes('block.number')) { //find external calls
            warn ="It is possible to estimate a time delta using the block.number property and average block time, however this is not future proof as block times may change.-" + " line " + (index+1);       
                warnings.push(warn);
                
        }

        //Use interface type instead of the address for type safety
        if ((dataArray[index].includes(searchFunction)) && dataArray[index].includes('(') && dataArray[index].includes('address') ) { //find function calls
                warn ="When a function takes a contract address as an argument, it is better to pass an interface or contract type rather than raw address. If the function is called elsewhere within the source code, the compiler it will provide additional type safety guarantees -" + " line " + (index+1);       
                warnings.push(warn);

        }

        if (dataArray[index].includes('extcodesize')) { //find external calls
            warn ="Avoid using extcodesize to check for Externally Owned Accounts." + " line " + (index+1);       
                warnings.push(warn);
                
        }

        if ((dataArray[index].includes('EIP-20')) || (dataArray[index].includes('approve(')) ){
             EIPE20Check ++;

            if (EIPE20Check >= 2){
                warn ="The EIP-20 token's approve() function creates the potential for an approved spender to spend more than the intended amount. A front running attack can be used, enabling an approved spender to call transferFrom() both before and after the call to approve() is processed." + " line " + (index+1);       
                warnings.push(warn);
            }
        }


        //Prevent transferring tokens to the 0x0 address
        if ((dataArray[index].includes(searchFunction)) && dataArray[index].includes('(') && (dataArray[index].includes('transferFrom') || dataArray[index].includes('transfer')) ) { //find function calls
                warn ="Prevent transferring tokens to the 0x0 address and prevent transferring tokens to the same contract address. -" + 
                "After your function declaration, you could the modifier:" +
                "modifier validDestination( address to ) {" +
                "require(to != address(0x0));" +
                "require(to != address(this) );" +
                "};" +
                " line " + (index+1);       
                warnings.push(warn);
        }


        //Safemath preventions
        if ((dataArray[index].includes('uint256')) && (dataArray[index].includes('=')) && ((dataArray[index].includes('*')) || 
        (dataArray[index].includes('-')) || (dataArray[index].includes('+')) || (dataArray[index].includes('/')) ) ) { //find external calls
            warn ="Be aware that doing math functions on uint256 can cause overflows and underflows. We recommend you implement OpenZeppelin SafeMath. line " + (index+1);       
                warnings.push(warn);
                
        }



        //Prevent transferring tokens to the 0x0 address
        if ((dataArray[index].includes(searchFunction)) && (dataArray[index].includes('(')) && ((dataArray[index].includes('transferFrom')) || 
        (dataArray[index].includes('transfer')) || (dataArray[index].includes('withdraw'))) && (!dataArray[index].includes('onlyPayloadSize')))  { //find function calls
                warn ="Prevent Short address attack by by introducing onlyPayloadSize modifier. line " + (index+1);       
                warnings.push(warn);
        }


}
actionLines.push(dataArray.length);//add end of contract


console.log(
    '\n'+
    "GENERATING COMPILERS REPORT "+
    '\n'+
    ">>>>>>>>>>>>>>>>>>>>>>");

function readWriteSync() {
    let testCompile;
    let contractPath2;
    let data2 ;
    //console.log(data2);
    var newValue = data.replace(pragmaDeclaration, pragmaDeclaration);
    fs.writeFileSync('./compileFolder/sampleContract.sol', newValue, 'utf-8');

    for (i=0; i<complilerArray.length; i++){
    contractPath2 = path.resolve(__dirname, 'compileFolder', 'sampleContract.sol');
    data2 = fs.readFileSync(contractPath2,'utf8');

    fs.writeFileSync('./compileFolder/sampleContract.sol', newValue, 'utf-8');

      testCompile = solc.compile(data2, 1);
      //console.log(testCompile);
    

      try {
  let testGasCosts = testCompile.contracts[contractName2].gasEstimates.creation;

}
catch(err) {
  if(err){
    errorCheck =1;
    console.log(err);
  }

} 
finally {  
    if (errorCheck ===1){
        console.log("Compiler " + complilerArray[i] + " failed to compile your code");

}else{
        console.log("Compiler " + complilerArray[i] + " successfully compiled your code!!");
}
}
//});
}
}



readWriteSync();


//Check level of audting 
if(testLevel==0){

for (let i=0; i<warnings.length; i++) {

    console.log(warnings[i] + '\n' );
}
    

}else{
    console.log("DEEP CHECK" +'\n'+
        ">>>>>>>>>>>>>>>>>>>>>>>>>>" + '\n');
    let transferCount =0;
    let setRequireStatementForIndividualBalanceNotZeroValve = false;
    let setRequireStatementForAccountBalanceValve = false;
    let setAccountBalanceValve = false;

    for (let k = 0; k<actionLines.length; k++){

    for (let i=actionLines[k]; i<actionLines[k+1]; i++) {

        //Audit for multiple transfers within 1 function
        if ((dataArray[i].includes('.transfer('))|| (dataArray[i].includes('.send(')) || (dataArray[i].includes('.call.value('))) {
            transferCount++;
            if(transferCount >=2){
                warn = "Avoid multiple transfers within a single function. line -" + (i+1) ;
                warnings.push(warn);

            }
        }

        //check if there is require statement for individuals balance
        if (((dataArray[i].includes('require('))) && ((dataArray[i].includes('='))) && ((dataArray[i].includes('!'))) ) {
                setRequireStatementForIndividualBalanceNotZeroValve = true;
        }


        //check if there is require statement that sets smart contract account balance to 0
        if (((dataArray[i].includes('require('))) && ((dataArray[i].includes('this.balance'))) ) {
                setRequireStatementForAccountBalanceValve = true;
        }


        //check if users account balance has been set to zero
        if (((dataArray[i].includes('='))) && ((dataArray[i].includes('0'))) ) {
                setAccountBalanceValve = true;
        }


        //Audting for using .send()
        if ((dataArray[i].includes('.send('))) {

        if(!setRequireStatementForIndividualBalanceNotZeroValve){
                warn = "Be aware of rerentrancy attack. Before withdraw or transfers, use a require statement to ensure user has available fund. Example require(UserBalance != 0); -" + (i+1) ;
                warnings.push(warn); 
            }

        if(!setRequireStatementForAccountBalanceValve){
                warn = "Be aware of rerentrancy attack. Before withdraw or transfers, use a require statement to ensure smart contract has available fund. require(this.balance >= payment); -" + (i+1) ;
                warnings.push(warn); 
            }

        if(!setAccountBalanceValve){
                warn = "Be aware of rerentrancy attack. Set post-withdrawal balance before sending. -" + (i+1) ;
                warnings.push(warn); 
            }

        }

    }
    transferCount = 0;//reset transfer count
    setRequireStatementForIndividualBalanceNotZeroValve = false;
    setRequireStatementForAccountBalanceValve = false;
    setAccountBalanceValve = false;
};

let soldidtyCoverageValve = false;

for (let i=0; i<warnings.length; i++) {

    console.log(warnings[i] + '\n' );
   // console.log("There are " + actionLines.length + " action calls in this smart contract");
   soldidtyCoverageValve = true;
}











if(soldidtyCoverageValve){

console.log(
    '\n'+
    "GENERATING SOLIDITY COVERAGE REPORT "+
    '\n'+
    ">>>>>>>>>>>>>>>>>>>>>>");

//Generate Solidity Coverage
const path = require ('./node_modules/.bin/solidity-coverage');
};


}

});



// console.log(
// 	">>>>>>>>>>>>>>>>>>> " +
// 	'\n'
// 	+data+
// 	'\n'+
// 	" >>>>>>>>>>>>>>>>>>>>");



//CONSOLE PRINT OUTS
console.log(
    "COMPILATIONS"+
    '\n'+
    ">>>>>>>>>>>>>>>>>>>>>>");
//console.log(output2.errors);

if(output2.contracts[contractName2].gasEstimates.creation === null) {
    output.errors.forEach(err => console.log(err.formattedMessage));
    console.log("compilation was unsuccessful, please edit your code and try again")
}else{
    console.log("compilation was successful!"
        +'\n' +
        '\n' )
}

fse.ensureDirSync(buildPath);


console.log(
    "GAS COSTS" +
    '\n' +
    ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" +
    '\n'+
    "Estimated code deposit gas cost is  "+ gasCosts[0]+ " Wei" + '\n' +
    "Estimated execution cost for code is " + gasCosts[1] + " Wei" +
    '\n' +
    '\n');


console.log(    "OTHERS" +
    '\n'+
    ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")

console.log("the size of your smart contract file is " + fileSizeInBytes +" Bytes");

console.log("the size of your smart contract file is " + fileSizeInKiloytes + " KB");

console.log("There are " + lineCount(data)+ " lines of code in your smart contract");

console.log("There are " + data.length + " characters in your smart contract");


}
}

}


//Guideline information was dervied from various sources such as
//https://consensys.github.io/
//https://consensys.github.io/smart-contract-best-practices/known_attacks/#reentrancy

