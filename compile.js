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

try{
contractName = readline.question("Enter the name of your file of your file: ");
console.log('\n'+"TITLE: " + contractName);
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
    let dangerousCalls1 = 'call.value()';
    let searchCurlyBrace = '()';
    let lastIndex = -1; // let say, we have not found the keyword



    console.log('\n'+
        '\n'+
        "QUIKKY Auditing..."+
        '\n' +
        ">>>>>>>>>>>>>>>>>>>>>>>>>>>");
    let warn;


    for (let index=0; index<dataArray.length; index++) {


        if (dataArray[index].includes(searchFunction)) { //find function calls
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
    

        if (dataArray[index].includes(dangerousCalls1)) { //find external calls
            warn ="Avoid using 'call.value()', it is susceptible to re-entry attacks, if possible use send() or transfer() " + (index+1);       
                warnings.push(warn);
                
        }


}

for (let i=0; i<warnings.length; i++) {

    console.log(warnings[i] + '\n' );
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




