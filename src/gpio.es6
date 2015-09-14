import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

let sysExec = childProcess.exec;


let gpioAdmin     = 'gpio-admin';                // gpio-admin binary path
let gpioSysPath   = '/sys/devices/virtual/gpio'; // gpio system-files path
let platform      = null;                        // customID => systemID map
let watchInterval = 10;                          // Minimum interval at which events may be emitted
let pinMap        = {};                          // Stores exported Gpio objects

// TODO: automatic platform detection

/**
 * Set gpio-admin executable path
 *
 * @param  {String} newGpioAdminPath gpio-admin binary path
 * @return {Promise}
 */
export function setGpioAdminPath(newGpioAdminPath) {
    gpioAdmin = newGpioAdminPath;
    return new Promise(function(resolve, reject) {
        sysExec(gpioAdmin, function(err) {
            if (!err || err.message.indexOf('gpio-admin') === -1) {
                return reject(new Error(
                    'Executable not recognized as gpio-admin'
                ));
            }
            resolve();
        });
    });
}


/**
 * Set the gpio system files path
 *
 * @param {String} newGpioSysPath gpio system-files path
 */
export function setGpioSysPath(newGpioSysPath) {
    if (!fs.existsSync(newGpioSysPath)) {
        throw new Error('Gpio system path doesn\'t exists');
    }

    gpioSysPath = newGpioSysPath;
}


/**
 * Load GPIO map from platform file, or try to auto-detect it
 *
 * @param  {String|null} platformFile Platform file path if provided;
 *                                 try to auto-detect the platform otherwise
 */
export function init(platformFile) {
    let platform_       = require(path.resolve('./platforms/' + platformFile + '.json'));
    let platformIdKey   = platform_.identifier[0];
    let platformIdValue = platform_.identifier[1];

    let id = fs.readFileSync('/proc/cpuinfo')
        .toString()
        .split('\n')
        .filter(function(line) {
            return (line.split(':')[0].trim() === platformIdKey);
        });

    if (id.length === 0) {
        throw Error(`Platform identifier key "${platformIdKey}" not found`);
    }

    let idValue = id[0].split(':')[1].trim();
    if (idValue !== platformIdValue) {
        throw Error(`Platform identifier value "${platformIdValue}" not found;
            Found "${idValue}" instead`);
    }

    platform = platform_;
}


/**
 * Set a new watchInterval. The less it is, the more the process will be CPU-heavy
 *
 * @param {Number} newWatchInterval In milliseconds
 */
export function setWatchInterval(newWatchInterval) {
    if (newWatchInterval !== parseInt(newWatchInterval, 10)) {
        throw new TypeError('newWatchInterval must be a positive integer');
    }

    watchInterval = newWatchInterval;
}


/**
 * Gpio instance getter
 *
 * @param  {Number} gpioID_ specific platform custom or systemID
 * @return {Object}        Gpio instance
 */
export function get(gpioID_) {
    var gpioID = gpioID_;

    // Platform-specific gpio map loaded
    if (platform) {
        gpioID = platform.pinMap[gpioID_];
        if (!gpioID) {
            throw new ReferenceError('Unknown gpio custom ID: ' + gpioID_);
        }
    }

    // Gpio instance already created
    if (pinMap[gpioID]) {
        return pinMap[gpioID];
    }

    // Create new instance
    pinMap[gpioID] = new Gpio(parseInt(gpioID));
    return pinMap[gpioID];
}


/**
 * Remove all stored Gpio instances. Used for testing purposes
 *
 */
export function reset() {
    pinMap = {};
}


/**
 * Represent a physical GPIO.
 * One instance per systemID stored in the static pinMap object.
 *
 * @class
 */
class Gpio extends EventEmitter {
    /**
     * Private constructor
     *
     * @private
     * @param  {Number} gpioID System GpioID
     */
    constructor(gpioID) {
        super();

        if (gpioID !== parseInt(gpioID, 10)) {
            throw new TypeError('gpio ID must be a Number');
        }

        this.gpioID = gpioID;
        this.mode   = null;
        this.watch  = null;
        this.opened = false;
    }

    /**
     * Make the GPIO available to use
     *
     * @return {Promise}
     */
    open(option) {
        return new Promise((resolve, reject) => {
            if (this.opened) {
                resolve();
            } else if (option && option !== 'pullup' && option !== 'pulldown') {
                reject(new TypeError(
                    'option must be either "pullup" or "pulldown"'
                ));
            } else if (!option) {
                option = '';
            }

            sysExec(`${gpioAdmin} export ${this.gpioID} ${option}`, function(err) {
                if (err) {
                    return reject(new Error(err));
                }
                resolve();
            });
        });
    }


    /**
     * Close GPIO, making it unavailable to use
     *
     * @return {Promise}
     */
    close() {
        return new Promise((resolve, reject) => {
            sysExec(`${gpioAdmin} unexport ${this.gpioID}`, function(err) {
                if (err) {
                    return reject(new Error(err));
                }
                resolve();
            });
        });
    }


    /**
     * Set the GPIO mode
     *
     * @param  {String} newMode Value must be either "input" or "output"
     * @return {Promise}
     */
    setMode(newMode) {
        return new Promise((resolve, reject) => {
            if ((newMode !== 'input') && (newMode !== 'output')) {
                return reject(new TypeError(
                    'newMode must be either "input" or "output".'
                ));
            }

            fs.writeFile(gpioSysPath + '/gpio' + this.gpioID + '/direction', newMode, (err) => {
                if (err) {
                    return reject(new Error(err));
                }
                this.mode = newMode;
                resolve();
            });
        });
    }


    /**
     * Get the GPIO mode
     *
     * @return {Promise} Returned value is either "input" or "output"
     */
    getMode() {
        return new Promise((resolve, reject) => {
            fs.readFile(gpioSysPath + '/gpio' + this.gpioID + '/direction', 'utf8',
                function(err, res) {
                    if (err) {
                        return reject(new Error(err));
                    }
                    resolve(res);
                });
        });
    }


    /**
     * Set the GPIO value. Used in "output" mode
     *
     * @param  {String} newValue  Value must be either "high" or "low"
     * @return {Promise}
     */
    setValue(newValue) {
        return new Promise((resolve, reject) => {
            if ((newValue !== 'high') && (newValue !== 'low')) {
                return reject(new TypeError('newValue must be either "high" or "low"'));
            } else if (this.mode !== 'output') {
                return reject(new Error('Gpio is not set to output mode'));
            }

            fs.writeFile(gpioSysPath + '/gpio' + this.gpioID + '/value', newValue, function(err) {
                if (err) {
                    return reject(new Error(err));
                }
                resolve();
            });
        });
    }


    /**
     * Get the GPIO value. Used in "input" mode
     *
     * @return {Promise} Returned value is either "high" or "low"
     */
    getValue() {
        return new Promise((resolve, reject) => {
            if (this.mode !== 'input') {
                return reject(new Error('Gpio is not set to input mode'));
            }

            fs.readFile(gpioSysPath + '/gpio' + this.gpioID + '/value', 'utf8', function(err, res) {
                if (err) {
                    return reject(new Error(err));
                }
                resolve(res);
            });
        });
    }


    /**
     * Start listening to events
     */
    startWatch() {
        if (!this.watch) {
            this.watch = setInterval(() => {
                if (this.mode !== 'input') {
                    return;
                }

                this.getValue().then((newValue) => {
                    /**
                     * Change event.
                     * Fired on value change
                     *
                     * @event Gpio#change
                     */
                    if ((this.value === undefined) || (this.value !== newValue)) {
                        this.emit('change');
                    }

                    /**
                     * Raising event.
                     * Fired when values goes from "low" to "high"
                     *
                     * @event Gpio#raising
                     */
                    if ((this.value === 'low' || this.value === undefined) &&
                        newValue === 'high') {
                        this.emit('raising');
                    }

                    /**
                     * Falling event.
                     * Fired when values goes from "high" to "low"
                     *
                     * @event Gpio#falling
                     */
                    if ((this.value === 'low' || this.value === undefined) &&
                        newValue === 'low') {
                        this.emit('falling');
                    }

                    this.value = newValue;
                }).catch((err) => {
                    /**
                     * Error event.
                     * Fired when an error occurs while reading a value
                     *
                     * @event Gpio#error
                     */
                    this.emit('error', err);
                });
            }, watchInterval);
        }
    }


    /**
     * Stop listening to events
     */
    stopWatch() {
        if (this.watch) {
            clearInterval(this.watch);
        }
    }
}