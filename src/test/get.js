import 'source-map-support/register';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import path from 'path';
import * as gpio from '../gpio';

// Provide promise-friendly should syntax
chai.use(chaiAsPromised);
let should = chai.should();

describe('get', function() {
    it('should return a new Gpio instance by systemID', function() {
        let gpio0 = gpio.get(0);
        gpio0.should.exist;

        // In order to test if it is a singleton
        gpio0.customVar = true;
    });

    it('should return an existing Gpio instance by systemID', function() {
        gpio.get(0).customVar.should.equal(true);
    });

    describe('platform specific access', function() {
        // Find a working id to pass the tests
        let localId = fs.readFileSync('/proc/cpuinfo')
            .toString()
            .split('\n')[0]
            .split(':');

        let testPlatform = {
            identifier: [localId[0].trim(), localId[1].trim()],
            pinMap: {
                0: 1,
                1: 2,
            },
        };
        let filePath = path.resolve('./platforms/testPlatform.json');

        // Create a test platform json
        before(function() {
            fs.writeFileSync(filePath, JSON.stringify(testPlatform));
        });

        it('should return a new Gpio instance by plateform-specific accessID ', function() {
            gpio.init('testPlatform');
            let gpio0 = gpio.get(0); // accessId: 0; systemId: 1
            gpio0.should.exist;
            should.not.exist(gpio0.customVar);
        });

        it('should throw "Unknown gpio access ID"', function() {
            should.Throw(function() {
                gpio.get(3);
            }, 'Unknown gpio custom ID: 3');
        });

        // Delete test plateform file
        after(function() {
            fs.unlinkSync(filePath);
        });
    });
});