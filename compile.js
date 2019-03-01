const path = require ('path');
const solc = require ('solc');
const dirfie = "dir.txt";
const fse = require('fs-extra');
const fs = require('fs');
var findInFiles = require('find-in-files');

let functionCounter =0;


const supplyChainPath = path.resolve(__dirname, 'contracts', 'sampleContract.sol');
let data = fs.readFileSync(supplyChainPath,'utf8');
const buildPath = path.resolve(__dirname, 'build');
fse.removeSync(buildPath);
let output = solc.compile(data, 1).contracts;

const output2 = solc.compile(data.toString(), 1);
const gasCosts = output2.contracts[':Migrations'].gasEstimates.creation;

console.log(gasCosts);

    
// setTimeout(function(){ 
//     var obj = JSON.parse(fs.readFileSync('./build/Migrations.json', 'utf8'));
//     let output2 = JSON.parse(output);


// }, 3000);




for (let contract in output) {
    fse.outputJsonSync(
      path.resolve(buildPath, contract.replace(':', '') + '.json'),
      output[contract]
    );

};



let input = fs.createReadStream('./Hello.txt');
let filesize = fs.statSync('./Hello.txt').size;
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



fs.readFile('Hello.txt', {encoding: 'utf-8'}, function(err, data) {
    if (err) throw error;

    let dataArray = data.split('\n'); // convert file data in an array
    const searchKeyword = 'function'; // we are looking for a line, contains, key word 'user1' in the file
    let lastIndex = -1; // let say, we have not found the keyword

    for (let index=0; index<dataArray.length; index++) {
        if (dataArray[index].includes(searchKeyword)) { // check if a line contains the 'user1' keyword
        	functionCounter++;
        //console.log (dataArray[index]);
        //console.log("count is now " + functionCounter);

            //lastIndex = index; // found a line includes a 'user1' keyword
           // break; 
        }
        //console.log("count is now " + counter);
    }
console.log("There are " + functionCounter + " function declarations in the your smart contract");
});




console.log(
	">>>>>>>>>>>>>>>>>>> " +
	'\n'
	+data+
	'\n'+
	" >>>>>>>>>>>>>>>>>>>>");



//CONSOLE PRINT OUTS
console.log(
    "COMPILATIONS"+
    '\n'+
    ">>>>>>>>>>>>>>>>>>>>>>");

if(output.errors) {
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
    "Estimated code deposit gas cost is  "+ gasCosts[0] + '\n' +
    "Estimated execution cost for code is " + gasCosts[1] +
    '\n' +
    '\n');


console.log(    "OTHERS" +
    '\n'+
    ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")

console.log("There are " + lineCount(data)+ " lines of code in your smart contract");

console.log("There are " + data.length + " characters in your smart contract");




