import 'source-map-support/register';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import path from 'path';
import * as gpio from '../gpio';

// Provide promise-friendly should syntax
chai.use(chaiAsPromised);
let should = chai.should();


describe('init', function() {
    // Find a working id to pass the tests
    let localId = fs.readFileSync('/proc/cpuinfo').toString().split('\n')[0].split(':');
    let testPlatform = {
        identifier: [ localId[0].trim(), localId[1].trim() ],
        pinMap: {
            0: 1,
            1: 2,
        },
    };
    let filePath = path.resolve('./platforms/testPlatform.json');

    // Create a test platform json
    beforeEach(function() {
        fs.writeFileSync(filePath, JSON.stringify(testPlatform));
        delete require.cache[require.resolve(filePath)];
    });

    it('should load a platform without errors', function() {
        gpio.init('testPlatform');

        testPlatform.identifier[1] += 'thisShouldRaiseAndError';
    });

    it('should throw "Platform value not found"', function() {
        should.Throw(function() {
            gpio.init('testPlatform');
        }, 'Platform identifier value');

        testPlatform.identifier[0] += 'thisShouldRaiseAndError';
    });

    it('should throw "Platform identifier not found"', function() {
        should.Throw(function() {
            gpio.init('testPlatform');
        }, 'Platform identifier key');
    });

    // Delete test plateform file
    after(function() {
        fs.unlinkSync(filePath);
    });
});