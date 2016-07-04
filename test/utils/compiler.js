var aira = require('../../index');

const mainsol  = __dirname + '/../../sol';
const cachedir = __dirname + '/../../.cache';
const libsfile = __dirname + '/.libs.json';

var soldirs = [];
soldirs.push(mainsol); 

var compiler = function(contract) {
	return new Promise(function(resolve, reject) {
		aira.compiler.compile(soldirs, cachedir, false, function (compiled) {
			if (typeof(compiled.errors) != 'undefined') {
				reject('An error occured:');
			}
			
			var bytecode = compiled.contracts[contract].bytecode;
			var linked_bytecode = aira.compiler.link(libsfile, bytecode);
			var interface = compiled.contracts[contract].interface.replace("\n", "");

			resolve([linked_bytecode, interface]);
		});
	});
}

var reglib = function(contract, contract_address) {
	aira.compiler.reglib(libsfile, contract, contract_address);
}

module.exports = {
    "compiler": compiler,
    "reglib":   reglib
}
