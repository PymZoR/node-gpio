#!/usr/bin/env node
import childProcess from 'child_process';

let sysExec   = childProcess.exec;


function exportGpio(id, option) {
    sysExec(`mkdir ./sys/devices/virtual/gpio/gpio${id}`, function(err, stdout) {
        sysExec(`touch ./sys/devices/virtual/gpio/gpio${id}/direction`);
        sysExec(`touch ./sys/devices/virtual/gpio/gpio${id}/value`);
    });
}


function unexportGpio(id, option) {
    sysExec(`rm -r ./sys/devices/virtual/gpio/gpio{id}`);
}


if (process.argv.length < 3) {
    console.error('usage: gpio-admin {export|unexport}');
    process.exit(1);
}


switch (process.argv[2]) {
    case 'export': {
        exportGpio(process.argv[3]);
        break;
    }
    case 'unexport': {
        unexportGpio(process.argv[3]);
        break;
    }

    default:
}
