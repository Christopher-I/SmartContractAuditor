const path = require ('path');
const solc = require ('solc');
const dirfie = "dir.txt";
const fse = require('fs-extra');
const fs = require('fs');

let counter =0;

let data = fs.readFileSync('./hello','utf8');

let input = fs.createReadStream('./Hello');
let filesize = fs.statSync('./Hello').size;
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

console.log(
	">>>>>>>>>>>>>>>>>>> " +
	'\n'
	+data+
	'\n'+
	" >>>>>>>>>>>>>>>>>>>>");

console.log("There are " + lineCount(data)+ " lines of code in your smart contract");

console.log("There are " + data.length + " characters in your smart contract");




