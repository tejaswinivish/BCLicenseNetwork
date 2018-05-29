'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {

  // The Init method is called when the Smart Contract 'license_manager' is instantiated by the blockchain network
  // Best practice is to have any Ledger initialization in separate function -- see initLedger()
  async Init(stub) {
    console.info('=========== Instantiated license_manager chaincode ===========');
    return shim.success();
  }

  // The Invoke method is called as a result of an application request to run the Smart Contract
  // 'license_manager'. The calling application program has also specified the particular smart contract
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
      License: 'licensenumber1',
      timestamp: '444747493928'
    });
	
    licenses.push({
     License: 'licensenumber2',
     timestamp: '4458587493928'
    });
   
   
   await stub.putState('peer0.org1' + Buffer.from(JSON.stringify(licenses[0]));
   await stub.putState('peer1.org1' + Buffer.from(JSON.stringify(licenses[1]));
   
    console.info('============= END : Initialize Ledger ===========');
  }

/*   async createCar(stub, args) {
    console.info('============= START : Create Car ===========');
    if (args.length != 5) {
      throw new Error('Incorrect number of arguments. Expecting 5');
    }

    var car = {
      docType: 'car',
      make: args[1],
      model: args[2],
      color: args[3],
      owner: args[4]
    };

    await stub.putState(args[0], Buffer.from(JSON.stringify(car)));
    console.info('============= END : Create Car ===========');
  } */

  async queryAllTokens(stub, args) {

    let startKey = 'peer0.org1';
    let endKey = 'peer4.org1';

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
    license.owner = args[1];

    await stub.putState(args[0], Buffer.from(JSON.stringify(car)));
    console.info('============= END : changeLicenseOwner ===========');
  }
};

shim.start(new Chaincode());
