console.log("Welcome to QUIKKY Smart Contract Auditor " + '\n');
const path = require ('path');
const solc = require ('solc');
const dirfie = "dir.txt";
const fse = require('fs-extra');
const fs = require('fs');
var findInFiles = require('find-in-files');

var readline = require('readline-sync');
let contractName;
var warnings = new Array() ;
let testLevel ;

try{
contractName = readline.question("Enter the name of your file of your file: ");
testLevel = readline.question("Do you want a QUIKKY test or a HANDWAX test level ?(enter 0 for quikky and 1 for handwax: ");
console.log('\n'+"TITLE: " + contractName);

if (testLevel = 0){
    console.log("QUIKKY job");
}
    else if (testLevel = 1 ){
        console.log("DEEP job");
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
let gasCosts;


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
let fileSizeInMegabytes = fileSizeInBytes / 1000000.0



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



    console.log('\n'+
        '\n'+
        "QUIKKY Auditing..."+
        '\n' +
        ">>>>>>>>>>>>>>>>>>>>>>>>>>>");
    let warn;


    for (let index=0; index<dataArray.length; index++) {


        //Store action Lines
                // Audit payable transaction restrictions
        if ((dataArray[index].includes(searchFunction) && dataArray[index].includes('(')) || 
        (dataArray[index].includes('contract') && dataArray[index].includes('(')) ||
        (dataArray[index].includes('constructor') && dataArray[index].includes('(')) ){ //find function calls
            actionLines.push(index);

        };

        // Audit payable transaction restrictions
        if (dataArray[index].includes(searchFunction) && dataArray[index].includes('(')) { //find function calls
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




}
actionLines.push(dataArray.length);//add end of contract


//Check level of audting 
if(testLevel==0){

for (let i=0; i<warnings.length; i++) {

    console.log(warnings[i] + '\n' );
}
    

}else{
    console.log("DEEP CHECK" +'\n'+
        ">>>>>>>>>>>>>>>>>>>>>>>>>>" + '\n');
    let transferCount =0;

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
    }
    transferCount = 0;//reset transfer count
};








for (let i=0; i<warnings.length; i++) {

    console.log(warnings[i] + '\n' );
   // console.log("There are " + actionLines.length + " action calls in this smart contract");
}



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

console.log("you size of your smart contract file is " + fileSizeInBytes +" Bytes");

console.log("you size of your smart contract file is " + fileSizeInMegabytes + " MB");

console.log("There are " + lineCount(data)+ " lines of code in your smart contract");

console.log("There are " + data.length + " characters in your smart contract");

}
}
}




