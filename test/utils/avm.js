var VM = require('ethereumjs-vm')
var ethJSUtil = require('ethereumjs-util');
var EthJSTX = require('ethereumjs-tx');
var ethJSABI = require('ethereumjs-abi');
var EthJSBlock = require('ethereumjs-block');
var BN = ethJSUtil.BN;

var Avm = function () {
	this.vm = new VM(null, null, { activatePrecompiles: true, enableHomestead: true });

	this.accounts = [];
	this.addAccount('3cd7232cd6f3fc66a57a6bedc1a8ed6c228fff0a327e169c2bcc5e869ed49511');
};

Avm.prototype.runTx = function(args)
{
	var self = this;
	return new Promise(function(resolve, reject) {
		if (!args.params) {
			args.params = [];
		}
		if (!args.data) {
			if (args.method) {
				var funAbi = self.getFuncAbiByName(args.method, args.params, args.abi);
				args.data = self.getData(funAbi, args.params);
			} else {
				var funAbi = self.getFuncAbiConstructor(args.abi);
				if (funAbi) {
					var data = self.getData(funAbi, args.params, true);
					args.data = args.bytecode + data;
				} else {
					args.data = args.bytecode;
				}
			}
		}
		if (!args.value) {
			args.value = 0;
		}
		if (!args.fromId) {
			args.fromId = 0;
		}
		var account = self.getAccount(args.fromId);
		tx = new EthJSTX({
			nonce: new Buffer([account.nonce++]),
			gasPrice: 1,
			gasLimit: 3000000000,
			to: args.to,
			value: new BN(args.value, 10),
			data: new Buffer(args.data, 'hex')
		});
		tx.sign(account.privateKey);
		var block = new EthJSBlock({
			header: {
				timestamp: new Date().getTime() / 1000 | 0
			},
			transactions: [],
			uncleHeaders: []
		});
		self.vm.runTx({block: block, tx: tx, skipBalance: true, skipNonce: true}, function(err, result){
			if (err) {
				reject(err);
			} else if (result.vm.exception && result.vm.exceptionError) {
				reject(result.vm.exceptionError);
			} else if (result.vm.return === undefined) {
				reject('Exception during execution.');
			} else {
				if (result.createdAddress) {
					resolve(result.createdAddress);
				} else if (funAbi) {
					resolve(self.decodeResponse(funAbi, result.vm.return));
				} else {
					resolve(result.vm.return);
				}
			}
		});
	});
}
	
Avm.prototype.addAccount = function(key)
{
	var privateKey = new Buffer(key, 'hex');

	var address = ethJSUtil.privateToAddress(privateKey);
	this.vm.stateManager.putAccountBalance(address, 'f00000000000000001', function cb () {});
	var account = { address: '0x'+ address.toString('hex'), privateKey: privateKey, nonce: 0 };
	this.accounts.push(account);
}
	
Avm.prototype.getAccount = function(id)
{
	return this.accounts[id];
}

Avm.prototype.getData = function(funABI, args, isConstructor)
{
	var types = [];
	for (var i = 0; i < funABI.inputs.length; i++) {
		types.push(funABI.inputs[i].type);
	}
	if (isConstructor === true) {
		return ethJSABI.rawEncode(types, args).toString('hex');
	}
	return Buffer.concat([ ethJSABI.methodID(funABI.name, types), ethJSABI.rawEncode(types, args) ]).toString('hex');
}

Avm.prototype.decodeResponse = function(funAbi, response)
{
	if (funAbi && funAbi.outputs.length > 0) {
		try {
			var outputTypes = [];
			var i;
			for (i = 0; i < funAbi.outputs.length; i++) {
				outputTypes.push(funAbi.outputs[i].type);
			}
			var decodedObj = ethJSABI.rawDecode(outputTypes, response);
			decodedObj = ethJSABI.stringify(outputTypes, decodedObj);

			for (i = 0; i < outputTypes.length; i++) {
				if (outputTypes[i] == 'address') {
					var addr = decodedObj[i];
					if (addr.slice(0, 2) === '0x') {
						addr = addr.slice(2);
						if (addr.length < 40) {
							var count = 40 - addr.length;
							addr = '0x' + '0'.repeat(count) + addr;
						}
					}
					decodedObj[i] = addr;
				}
			}
			return decodedObj;

		} catch (e) {
			console.log('Failed to decode output: ' + e);
		}
	}
}

Avm.prototype.getFuncAbiByName = function(name, input, abi)
{
	for (i = 0; i < abi.length; i++) {
		if (abi[i].name == name) {
			return abi[i];
		}
	}
	return false;
}

Avm.prototype.getFuncAbiConstructor = function(abi)
{
	for (i = 0; i < abi.length; i++) {
		if (abi[i].type == 'constructor') {
			return abi[i];
		}
	}
	return false;
}

module.exports = Avm;
