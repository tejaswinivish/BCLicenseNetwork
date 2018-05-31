'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {

  // The Init method is called when the Smart Contract 'license-manager' is instantiated by the blockchain network
  // Best practice is to have any Ledger initialization in separate function -- see initLedger()
  async Init(stub) {
    console.info('=========== Instantiated license-manager chaincode ===========');
    return shim.success();
  }

  // The Invoke method is called as a result of an application request to run the Smart Contract
  // 'license-manager'. The calling application program has also specified the particular smart contract
  // function to be called, with arguments
  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.error('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async queryToken(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting CarNumber ex: CAR01');
    }
    let Owner = args[0];
    let licenseBytes = await stub.getState(Owner); //get the car from chaincode state
	
    if (!licenseBytes || licenseBytes.toString().length <= 0) {
      throw new Error('License doesnot exists for' + Owner);
    }
    console.log(licenseBytes.toString());
    return licenseBytes;
  }

  async initLedger(stub, args) {
    console.info('============= START : Initialize Ledger ===========');
    let licenses = [];
    licenses.push({
      licenseKey:  'abcdefg012345',
	  timestamp: '00000000000000',
	  owner: 'available'
    });

    for (let i = 0; i < licenses.length; i++) {
      licenses[i].docType = 'licenseToken';
      await stub.putState('token' + i, Buffer.from(JSON.stringify(licenses[i])));
      console.info('Added <--> ', licenses[i]);
    }
    console.info('============= END : Initialize Ledger ===========');
  }

  async queryAllTokens(stub, args) {

    let startKey = 'token0';
    let endKey = 'token10';

    let iterator = await stub.getStateByRange(startKey, endKey);

    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  } 

  async changeTokenOwner(stub, args) {
    console.info('============= START : changeLicenseOwner ===========');
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let licenseBytes = await stub.getState(args[0]);
    let license = JSON.parse(licenseBytes);
    var availabilityTimestamp = Date.now();
    availabilityTimestamp = availabilityTimestamp + 20000;
	license.timestamp = availabilityTimestamp;
	license.owner = args[1];
	
    await stub.putState(args[0], Buffer.from(JSON.stringify(license)));
    console.info('============= END : changeLicenseOwner ===========');
  }
  
  async findAvailableToken(stub, args) {
	console.info('============= START : findAvailableToken ===========');
	let startKey = 'token0';
	let endKey = 'token10';
    let iterator = await stub.getStateByRange(startKey, endKey);
	let allResults = [];
	let availableToken=null;
	
	//Check if there are any available license tokens
	while (true) {
		console.info('********************** In first Loop *******************');
        let res = await iterator.next();
        if (res.value && res.value.value.toString()) {
			let jsonRes = {};
			console.log(res.value.value.toString('utf8'));
			jsonRes.Key = res.value.key;
			try {
				let tempToken = JSON.parse(res.value.value.toString('utf8'));
				if(tempToken.owner==='available') {
					availableToken = res.value.key;
					break;
				}
			} catch (err) {
				console.log(err);
				jsonRes.Record = res.value.value.toString('utf8');
			}
		}
		if (res.done) {
			console.log('end of data');
			await iterator.close();
			console.info('End of First loop');
			break;
		}
    }
	//Else check if there are any license tokens with expired timestamp
	if(availableToken==null) {
	  while (true) {
		console.info('********************** In Second Loop *******************');
		let iterator = await stub.getStateByRange(startKey, endKey);
		let res = await iterator.next();
		if (res.value && res.value.value.toString()) {
			let jsonRes = {};
			console.log(res.value.value.toString('utf8'));
			jsonRes.Key = res.value.key;
			try {
				let tempToken = JSON.parse(res.value.value.toString('utf8'));
				console.log(tempToken.timestamp);
				var currentTimestamp = Date.now();
				console.log(currentTimestamp);
				if(tempToken.timestamp < currentTimestamp) {
					availableToken = res.value.key;
					break;
				}
			} catch (err) {
				console.log(err);
				jsonRes.Record = res.value.value.toString('utf8');
			}
		}		
		if (res.done) {
			console.log('end of data');
			await iterator.close();
			console.info('End of second loop');
			break;
		}
	  }
	}
	
	//If we find an available license token, assign it to the requester else throw error
	if(availableToken !=null) {
		console.info('============= START : changeLicenseOwner ===========');
		let licenseBytes = await stub.getState(availableToken);
		let license = JSON.parse(licenseBytes);
		var availabilityTimestamp = Date.now();
		availabilityTimestamp = availabilityTimestamp + 20000;
		license.timestamp = availabilityTimestamp;
		license.owner = args[0];
		await stub.putState(availableToken, Buffer.from(JSON.stringify(license)));
		console.info('============= END : changeLicenseOwner ===========');
	} else {
		throw new Error('Currently no license token available. Please try after some time');	
	}
  }
};

shim.start(new Chaincode());
