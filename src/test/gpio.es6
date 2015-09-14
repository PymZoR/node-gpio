import 'source-map-support/register';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import childProcess from 'child_process';
import * as gpio from '../gpio';

// Provide promise-friendly should syntax
chai.use(chaiAsPromised);
let should  = chai.should();
let sysExec = childProcess.exec;


describe('Gpio', function() {
    var gpio0 = gpio.get(0);
    gpio.setGpioAdminPath('node lib/test/mock/gpio-admin.js');

    // Init for test environement
    before(function(done) {
        sysExec('mkdir -p ./sys/devices/virtual/gpio', function(err, stdout) {
            gpio.setGpioSysPath('./sys/devices/virtual/gpio');
            done();
        });
    });


    describe('open', function() {
        it('should throw a TypeError', function() {
            return gpio0.open('pull').should.be.rejectedWith(TypeError);
        });

        it('should open', function() {
            return gpio0.open().should.be.fulfilled;
        });

        it('should open with a pullup', function() {
            return gpio0.open('pullup').should.be.fulfilled;
        });

        it('should open with a pulldown', function() {
            return gpio0.open('pulldown').should.be.fulfilled;
        });
    });


    describe('close', function() {
        it('should close', function() {
            return gpio0.close().should.be.fulfilled;
        });
    });


    describe('setMode', function() {
        it('should return a TypeError', function() {
            return gpio0.setMode('inout').should.be.rejectedWith(TypeError);
        });

        it('should set to input mode', function() {
            return gpio0.setMode('input').should.be.fulfilled;
        });

        it('should set to output mode', function() {
            return gpio0.setMode('output').should.be.fulfilled;
        });
    });


    describe('getMode', function() {
        it('should return "output"', function() {
            return gpio0.getMode().should.become('output');
        });
    });


    describe('setValue', function() {
        it('should return an Error', function() {
            return gpio0.setMode('input').then(function() {
                return gpio0.setValue('high')
                    .should.be.rejectedWith('Gpio is not set to output mode');
            })
            .then(function() {
                return gpio0.setMode('output');
            });
        });

        it('should throw a TypeError', function() {
            return gpio0.setValue('highlow').should.be.rejectedWith(TypeError);
        });

        it('should set value to high', function() {
            return gpio0.setValue('high').should.be.fullfilled;
        });

        it('should set value to low', function() {
            return gpio0.setValue('low').should.be.fullfilled;
        });
    });


    describe('getValue', function() {
        it('should return an Error', function() {
            return gpio0.setMode('output').then(function() {
                return gpio0.getValue().should.be.rejectedWith('Gpio is not set to input mode');
            })
            .then(function() {
                return gpio0.setMode('input');
            });
        });


        it('should return a value', function() {
            return gpio0.getValue().should.be.fulfilled;
        });
    });


    describe('startWatch', function() {
        it('should start watching', function() {
            gpio0.startWatch();
        });

        it('should emit a "change" event', function(done) {
            gpio0.once('change', done);
            fs.writeFile('./sys/devices/virtual/gpio/gpio0/value', 'low');
        });

        it('should emit a "raising" event', function(done) {
            gpio0.once('raising', done);
            fs.writeFile('./sys/devices/virtual/gpio/gpio0/value', 'high');
        });

        it('should emit a "falling" event', function(done) {
            gpio0.once('falling', done);
            fs.writeFile('./sys/devices/virtual/gpio/gpio0/value', 'low');
        });
    });


    describe('stopWatch', function() {
        it('should stop watching', function() {
            gpio0.stopWatch();
        });

        it('should not emit any events', function(done) {
            let fired = false;
            gpio0.once('change', function() {
                fired = true;
            });

            fs.writeFile('./sys/devices/virtual/gpio/gpio0/value', 'high');
            setTimeout(function() {
                fired.should.equal(false, 'Change event has been fired');
                done();
            }, 15);
        });
    });


    // Remove test environement folders
    after(function(done) {
        sysExec('rm -r ./sys/', function(err, stdout) {
            done();
        });
    });
});