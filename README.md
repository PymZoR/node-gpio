[![Build Status](https://travis-ci.org/PymZoR/node-gpio.svg)](https://travis-ci.org/PymZoR/node-gpio)
# Node-gpio
A simple node.js platform-agnostic library to control GPIO pins, without running as root user.

# Installation
###### Install dependencies
The library depends on <a href="http://github.com/quick2wire/quick2wire-gpio-admin">quick2wire-gpio-admin</a> to ensure access to GPIO without running as root user.
```shell
$ git clone git://github.com/quick2wire/quick2wire-gpio-admin.git
$ cd quick2wire-gpio-admin
$ make
$ sudo make install
$ sudo adduser $USER gpio
```
###### Get with npm
```shell
$ npm install node-gpio
```

# Platforms
Accessing the GPIO pins can be done with two types of ID.
- With the system ID (SoC), refering to the kernel ID of the GPIO pin.
- With a custom user ID, usually refering to the visual ID printed on the board.

A file composed by an associative "pinMap" of visual ID to SoC ID can be used for convenience purposes. Some of the most used plaforms, like Raspberry Pi or ODROID-C1 have their own files already written in the [platforms/](platforms) directory. To use it, you have two options:

#### Automatic loading
Just call `gpio.init()` to automatically detect your platform and load the associated file, if it exists.

#### Using a custom file
Use the [init([platformFile])](#init) function, with platformFile referring to the file path. It must respect the format of [platforms/platform.json.example](platforms/platform.json.example), without the "identifier" part.

#### Bonus: Pull-request a new platform file
If you have written a new platform file and want to share it with the community in addition to enjoy the automatic detection feel free to submit a pull request with the platform file respecting the format of [platforms/platform.json.example](platforms/platform.json.example).
- The "pinMap" part must map all the physical pin ID to their associated SoC ID
- The "identifier" part is used to auto-detect the platform on which the program is run. To find one, you have to run the following command:
```shell
$ cat /proc/cpuinfo
```
Then, search for an unique key/value pair which is platform specific. For example, on a ODROID-C1 the key/value pair used is the following:
```json
"identifier": {
    "Hardware": "ODROIDC"
}
```

# API
## Functions
**_[setGpioAdminPath(newGpioAdminPath)](#setGpioAdminPath)_**  → **`Promise`**  
&nbsp;&nbsp;&nbsp;&nbsp;Set gpio-admin executable path

**_[setGpioSysPath(newGpioSysPath)](#setGpioSysPath)_**  
&nbsp;&nbsp;&nbsp;&nbsp;Set the gpio system files path

**_[init([platformFile])](#init)_**  
&nbsp;&nbsp;&nbsp;&nbsp;Load GPIO map from platform file, or try to auto-detect it

**_[setWatchInterval(newWatchInterval)](#setWatchInterval)_**  
&nbsp;&nbsp;&nbsp;&nbsp;Set a new watchInterval. The less it is, the more the process will be CPU-heavy

**_[get(gpioID)](#get)_**  → **`Object`**  
&nbsp;&nbsp;&nbsp;&nbsp;Gpio instance getter

**_[reset](#reset)_**  
&nbsp;&nbsp;&nbsp;&nbsp;Remove all stored Gpio instances. Used for testing purposes


<a name="setGpioAdminPath"></a>
### setGpioAdminPath(newGpioAdminPath)  → **`Promise`**
Set gpio-admin executable path

| Param | Type | Description |
| --- | --- | --- |
| newGpioAdminPath | `String` | gpio-admin binary path |

<a name="setGpioSysPath"></a>
### setGpioSysPath(newGpioSysPath)
Set the gpio system files path

| Param | Type | Description |
| --- | --- | --- |
| newGpioSysPath | `String` | gpio system-files path |

<a name="init"></a>
### init([platformFile])
Load GPIO map from platform file, or try to auto-detect it

| Param | Type | Description |
| --- | --- | --- |
| Load GPIO map from platform file, or try to auto-detect it | `String|null` | Platform file path if provided; try to auto-detect the platform otherwise |

<a name="setWatchInterval"></a>
### setWatchInterval(newWatchInterval)
Set a new watchInterval. The less it is, the more the process will be CPU-heavy.

| Param | Type | Description |
| --- | --- | --- |
| newWatchInterval | `Number` | In milliseconds |

<a name="get"></a>
### get(gpioID)  → `Object`
Gpio instance getter  

**Returns**: `Object` - Gpio instance  

| Param | Type | Description |
| --- | --- | --- |
| gpioID | `Number` | specific platform accessID or systemID |

<a name="reset"></a>
### reset()
Remove all stored Gpio instances. Used for testing purposes


## Gpio
Represent a physical GPIO.
One instance per systemID stored in the static pinMap object.


* [Gpio](#Gpio)
  * [new Gpio(gpioID)](#new_Gpio_new)
  * [.open()](#Gpio+open)  → `Promise`
  * [.close()](#Gpio+close)  → `Promise`
  * [.setMode(newMode)](#Gpio+setMode)  → `Promise`
  * [.getMode()](#Gpio+getMode)  → `Promise`
  * [.setValue(newValue)](#Gpio+setValue)  → `Promise`
  * [.getValue()](#Gpio+getValue)  → `Promise`
  * [.startWatch()](#Gpio+startWatch)
  * [.stopWatch()](#Gpio+stopWatch)
  * ["change"](#Gpio+event_change)
  * ["raising"](#Gpio+event_raising)
  * ["falling"](#Gpio+event_falling)
  * ["error"](#Gpio+event_error)

<a name="new_Gpio_new"></a>
### new Gpio(gpioID)
Private Constructor

| Param | Type | Description |
| --- | --- | --- |
| gpioID | `Number` | System GpioID |

<a name="Gpio+open"></a>
### gpio.open()  → `Promise`
Make the GPIO available to use

<a name="Gpio+close"></a>
### gpio.close()  → `Promise`
Close GPIO, making it unavailable to use

<a name="Gpio+setMode"></a>
### gpio.setMode(newMode)  → `Promise`
Set the GPIO mode

| Param | Type | Description |
| --- | --- | --- |
| newMode | `String` | Value must be either "input" or "output" |

<a name="Gpio+getMode"></a>
### gpio.getMode()  → `Promise`
Get the GPIO mode

**Returns**: `Promise` - Returned value is either "input" or "output"  

<a name="Gpio+setValue"></a>
### gpio.setValue(newValue)  → `Promise`
Set the GPIO value. Used in "output" mode

| Param | Type | Description |
| --- | --- | --- |
| newValue | `String` | Value must be either "high" or "low" |

<a name="Gpio+getValue"></a>
### gpio.getValue()  → `Promise`
Get the GPIO value. Used in "input" mode

**Returns**: `Promise` - Returned value is either "high" or "low"  

<a name="Gpio+startWatch"></a>
### gpio.startWatch()
Start listening to events

<a name="Gpio+stopWatch"></a>
### gpio.stopWatch()
Stop listening to events

<a name="Gpio+event_change"></a>
### "change"
Change event.
Fired on value change

**Kind**: event emitted by `[Gpio](#Gpio)`  

<a name="Gpio+event_raising"></a>
### "raising"
Raising event.
Fired when values goes from "low" to "high"

**Kind**: event emitted by `[Gpio](#Gpio)`  

<a name="Gpio+event_falling"></a>
### "falling"
Falling event.
Fired when values goes from "high" to "low"

**Kind**: event emitted by `[Gpio](#Gpio)`  

<a name="Gpio+event_error"></a>
### "error"
Error event.
Fired when an error occurs while reading a value

**Kind**: event emitted by `[Gpio](#Gpio)`

# License
This library is inspired by <a href="https://github.com/vallettea/odroid-gpio">odroid-gpio</a>

The MIT license.