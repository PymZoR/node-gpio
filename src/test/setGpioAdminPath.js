import 'source-map-support/register';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import path from 'path';
import * as gpio from '../gpio';

// Provide promise-friendly should syntax
chai.use(chaiAsPromised);
let should = chai.should();


describe('setGpioAdminPath', function() {
    it('should set admin path without errors', function() {
        // Work if gpio-admin is correctly installed
        return gpio.setGpioAdminPath('gpio-admin')
            .should.be.fulfilled;
    });

    it('should throw "Executable not recognized"', function() {
        return gpio.setGpioAdminPath('ls')
            .should.be.rejectedWith('Executable not recognized as gpio-admin');
    });
});