var assert = require('chai').assert;
var compiler = require('./utils/compiler').compiler;
var reglib = require('./utils/compiler').reglib;
var Avm = require('./utils/avm');

var avm = new Avm();

describe('contract proposal', function() {

	var addr;
	var abi;
	before(function(done) {
		compiler('Proposal').then(function(result){
			abi = JSON.parse(result[1]);
			var args = {
				abi: abi,
				bytecode: result[0],
				params: ['0x0000000000000000000000000000000000000001', 100, 'test']
			};

			avm.runTx(args).
				then(function (result) {
					addr = result;
		    			done();
				}).
				catch(function(e) {
					done(e);
				});
		});
	});

  it('deploy', function() {
	assert.equal('0x'+ addr.toString('hex'), '0x692a70d2e424a56d2c6c27aa97d1a86395877b3a');
  });

  it('var destination', function(done) {
	var argsAdr = {
		to: addr,
		abi: abi,
		method: 'destination',
		params: []
	};
	avm.runTx(argsAdr).
		then(function (result) {
			assert.equal(result[0], '0x0000000000000000000000000000000000000001');
    			done();
		}).
		catch(function(e) {
    			done(e);
		});

  });

  it('function summaryShares 0', function(done) {
	var argsAdr = {
		to: addr,
		abi: abi,
		method: 'summaryShares',
		params: []
	};
	avm.runTx(argsAdr).
		then(function (result) {
			assert.equal(result[0], '0');
    			done();
		}).
		catch(function(e) {
    			done(e);
		});

  });

  it('function setSummaryShares 10', function(done) {
	var argsAdr = {
		to: addr,
		abi: abi,
		method: 'setSummaryShares',
		params: [10]
	};
	avm.runTx(argsAdr).
		then(function (result) {
			assert.equal(result, undefined);
    			done();
		}).
		catch(function(e) {
    			done(e);
		});

  });

  it('function summaryShares 10', function(done) {
	var argsAdr = {
		to: addr,
		abi: abi,
		method: 'summaryShares',
		params: []
	};
	avm.runTx(argsAdr).
		then(function (result) {
			assert.equal(result[0], '10');
    			done();
		}).
		catch(function(e) {
    			done(e);
		});

  });


});
