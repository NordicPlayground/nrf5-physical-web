'use strict'

const serviceUUID       = '54207799-8f40-4fe5-bebe-6bb7022d3e73';
const ssidUUID          = '542077a9-8f40-4fe5-bebe-6bb7022d3e73';
const keystoreUUID      = '542077b9-8f40-4fe5-bebe-6bb7022d3e73';
const controlpointUUID  = '542077c9-8f40-4fe5-bebe-6bb7022d3e73';

// Charateristics:
var bleDevice;
var bleServer;
var bleService;
var ssidCharacteristic;
var keyCharacteristic;
var controlPointCharacteristic;

// Input from user:
var ssidStr;
var keyStr;
var actionDelay;
var duration;
var stateOnFailure;

// Uint8Arrays to be sent:
var ssidArray;
var keyArray;
var controlPointArray;

var allValuesValid = true;


window.onload = function()
{
    document.querySelector('#connect').addEventListener('click', connect);
    document.querySelector('#disconnect').addEventListener('click', disconnect);
    document.querySelector('#identify').addEventListener('click', identify);
    document.querySelector('#submit').addEventListener('click', validate);
};


// Sets up a bluetooth connection and gets the needed characteristics.
function connect()
{   
    if (!navigator.bluetooth) {
        log('> Web Bluetooth API is not available.\n' +
            '  Please make sure the Web Bluetooth\n' +
            '  flag is enabled.');
        return;
    }
    
    log('> Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({filters: [{services: [serviceUUID]}]})
    .then(device => {
        bleDevice = device;
        return device.gatt.connect();
    })
    .then(server => {
        bleServer = server;
        log('  Got bleServer');
        return server.getPrimaryService(serviceUUID);
    })
    .then(service => {
        log('  Got bleService');
        bleService = service;
    })
    .then(() => {
        return bleService.getCharacteristic(ssidUUID);
    })
    .then(characteristic => {
        ssidCharacteristic = characteristic;
        log('  Got SSID characteristic');
    })
	.then(() => {
        return bleService.getCharacteristic(keystoreUUID);
    })
    .then(characteristic => {
        keyCharacteristic = characteristic;
        log('  Got Key characteristic');
    })
	.then(() => {
        return bleService.getCharacteristic(controlpointUUID);
    })
    .then(characteristic => {
        controlPointCharacteristic = characteristic;
        log('  Got Control Point characteristic');
    })
    .then(() => {
        if (window.location.hostname == 'arduino') {
            readFile();
        }
        showConfigurationMode();
    })
    .catch(error => {
        log('> Connect: ' + error);
    });
}


// Disconnects the bluetooth connection.
function disconnect()
{
    if (!bleDevice) {
        log('> No Bluetooth Device connected...');
        showConnectableMode();
        return;
    }
    log('> Disconnecting from Bluetooth \n' +
        '  Device...');
    if (bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
        log('  Bluetooth Device connected: ' + bleDevice.gatt.connected);
    } else {
        log('  Bluetooth Device is already \n' + 
            '  disconnected');
    }
    showConnectableMode();
}


// Enters Indentify mode for 10 seconds, and returns to configuration mode.
function identify()
{
    var controlPointArrayIdentify = new Uint8Array([3, 0, 0, 0, 1, 0, 0, 0, 10, 2, 0]);
    controlPointCharacteristic.writeValue(controlPointArrayIdentify)
    .then(() => {
        log('> Enters Identity mode for 10 seconds');
    })
    .catch(error => {
        log('> Identify: ' + error);
    });
}


// Shows configuration content on the page.
function showConfigurationMode()
{
    document.getElementById('configuration_mode').style.display = 'block';
    document.getElementById('connectable_mode').style.display = 'none';
}


// Hides configuration content on the page.
function showConnectableMode()
{
    document.getElementById('configuration_mode').style.display = 'none';
    document.getElementById('connectable_mode').style.display = 'block';
}


// Validates all input values before setting them.
function validate()
{
    ssidStr = document.getElementById("ssid").value;
    keyStr = document.getElementById("key").value;
    actionDelay = document.getElementById("actiondelay").value;
    duration = document.getElementById("duration").value;
    stateOnFailure = document.getElementById("stateonfailure").value;
    
    if (ssidStr.length < 6 || ssidStr.length > 16) {
        log('> SSID must be between \n' +
            '  6 and 16 characters long');
        allValuesValid = false;
    }
    if (/^[a-zA-Z0-9]+$/.test(ssidStr) != true) {
        log('> SSID contains illegal characters');
        allValuesValid = false;
    }
    if (keyStr.length != 6 || isNaN(keyStr) == true) {
        log('> Key must be six numbers');
        allValuesValid = false;
    }
    if (actionDelay < 2) {
        log('> Action delay must be more than 1');
        allValuesValid = false;
    }
    else if (actionDelay > 0xffffffff) {
        log('> Action delay must be less than\n' +
            '  4294967295');
        allValuesValid = false;
    }
    if (duration < 1) {
        log('> Duration must be more than 0');
        allValuesValid = false;
    }
    else if (duration > 0xffffffff) {
        log('> Duration must be less than\n' +
            '  4294967295');
        allValuesValid = false;
    }
    if (allValuesValid == false) {
        allValuesValid = true;
        return;
    }
    
    setValues();
}


// Writes all values in order, reads them back to see if they were set correctly, and diconnects if successful.
function setValues()
{
    let buffer = new ArrayBuffer();
    let data = new DataView(buffer);
    
    setSSID()
    .then(() => {
        return ssidCharacteristic.readValue();
    })
    .then(value => {
        data = value;
        if (!equal(new Uint8Array(data.buffer), ssidArray)) {
            throw 'Error writing SSID';
        }
        return setKey();
    })
    .then(() => {
        return keyCharacteristic.readValue();
    })
    .then(value => {
        data = value;
        if (!equal(new Uint8Array(data.buffer), keyArray)) {
            throw 'Error writing Key';
        }
        return setControlPoint();
    })
    .then(() => {
        return controlPointCharacteristic.readValue();
    })
    .then(value => {
        data = value;
        if (!equal(new Uint8Array(data.buffer), controlPointArray)) {
            throw 'Error writing Control Point';
        }
        return;
    })
    .then(() => {
        log('> CONFIGURATION SUCCESSFUL! \n' +
            '  SSID             = ' + ssidStr + '\n' +
            '  Key              = ' + keyStr + '\n' +
            '  Action Delay     = ' + actionDelay + '\n' +
            '  Duration         = ' + duration + '\n' +
            '  State-on-Failure = ' + stateOnFailure);
        disconnect();
    })
    .catch(error => {
        log('> SetValues: ' + error);
    }); 
}


// Checks if two arrays are equal.
function equal(array1, array2)
{
    for (var i=0; i< array2.length; i++) {
        if (array1[i] != array2[i]) {
            return false;
        }
    }
    return true;
}


// Takes a string and converts each character to a decimal value.
function stringToArray(str)
{
    var arr = new Uint8Array(str.length);
    for (var i=0; i<str.length; i++) {
        arr[i] = str.codePointAt(i);
    }
    return arr;
}


// Takes a number and turns it into an Uint8 array.
function numberToUint8Array(num)
{
    var arr = new Uint8Array([
        (num & 0xff000000) >> 24,
        (num & 0x00ff0000) >> 16,
        (num & 0x0000ff00) >> 8,
        (num & 0x000000ff)
    ])
    return arr;
}


// Writes the SSID value. Returns a promise.
function setSSID()
{
    ssidArray = stringToArray(ssidStr);
    return ssidCharacteristic.writeValue(ssidArray);
}


// Writes the key value. Returns a promise.
function setKey()
{
    keyArray = stringToArray(keyStr);
    return keyCharacteristic.writeValue(keyArray);
}


// Writes the control point settings. Returns a promise.
function setControlPoint()
{
    controlPointArray = new Uint8Array(11);
    
    // Setting Opcode
    controlPointArray[0] = 1;
    
    // Setting Action Delay
    var actionDelayArray = numberToUint8Array(actionDelay);
    for (var i=0; i<4; i++) {
        controlPointArray[i+1] = actionDelayArray[i];
    }
    
    // Setting Duration
    var durationArray = numberToUint8Array(duration);
    for (var i=0; i<4; i++) {
        controlPointArray[i+5] = durationArray[i];
    }
    
    // Setting State-on-Failure
    controlPointArray[9] = stateOnFailure;
    
    // Setting Identity data
    controlPointArray[10] = 0;
    
    return controlPointCharacteristic.writeValue(controlPointArray);
}


// Logs to the console and the log displayed on the page.
function log(text)
{
    console.log(text);
    document.querySelector('#log').textContent += text + '\n';
}


// If files are stored locally on Tian, it can read SSID and Key from file
function readFile()
{
    var url = '/cgi-bin/get_ssid_and_key';
    var xmlHttp = new XMLHttpRequest();
    
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);
    
    var jsonArray = JSON.parse(xmlHttp.responseText);
    
    document.getElementById("ssid").value = jsonArray.result.ssid;
    document.getElementById("key").value  = jsonArray.result.key;
}

