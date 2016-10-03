'use strict'

const serviceUUID = '00001523-1212-efde-1523-785feabcd123';
const buttonCharacteristicUUID = '00001524-1212-efde-1523-785feabcd123';
const ledCharacteristicUUID = '00001525-1212-efde-1523-785feabcd123';

var bleDevice;
var bleServer;
var bleService;
var button1char;
var ledChar;
var button1count = 0;
var toggleFlag = false;

window.onload = function(){
  document.querySelector('#connect').addEventListener('click', connect);
  document.querySelector('#disconnect').addEventListener('click', disconnect);
  document.querySelector('#led2').addEventListener('click', toggleLED);
};

function connect() {
  if (!navigator.bluetooth) {
      log('Web Bluetooth API is not available.\n' +
          'Please make sure the Web Bluetooth flag is enabled.');
      return;
  }
  log('Requesting Bluetooth Device...');
  navigator.bluetooth.requestDevice({filters: [{services: [serviceUUID]}]})
  .then(device => {
    bleDevice = device;
    return device.gatt.connect();
  })
  .then(server => {
    bleServer = server;
    log('Got bleServer');
    return server.getPrimaryService(serviceUUID);
  })
  .then(service => {
    log('Got bleService');
    bleService = service;
  })
  .then(() => bleService.getCharacteristic(buttonCharacteristicUUID))
  .then( characteristic => {
    log('Got button1characteristic');
    button1char = characteristic;
    return button1char.startNotifications();
  })
  .then(() => {
    log('Notifications enabled');
    button1char.addEventListener('characteristicvaluechanged',handleNotifyButton1);
  })
  .then(() => {
    return bleService.getCharacteristic(ledCharacteristicUUID);
  })
  .then( characteristic => {
    ledChar = characteristic;
    log('Got ledChar');
  })
  .catch(error => {
    log('> connect ' + error);
  });
}

function disconnect() {
  if (!bleDevice) {
    log('No Bluetooth Device connected...');
    return;
  }
  log('Disconnecting from Bluetooth Device...');
  if (bleDevice.gatt.connected) {
    bleDevice.gatt.disconnect();
    log('> Bluetooth Device connected: ' + bleDevice.gatt.connected);
  } else {
    log('> Bluetooth Device is already disconnected');
  }
}

function handleNotifyButton1(event) {
  button1count += 1;
  log('Notification triggered by Button 1 ' + button1count);
  document.getElementById("btn1").innerHTML = button1count;
}

function toggleLED(){
    let toggle;
    if(toggleFlag === true){
      toggle = new Uint8Array([0]);
      toggleFlag = false;
    }
    else{
      toggle = new Uint8Array([1]);
      toggleFlag = true;
    }
    return ledChar.writeValue(toggle);
}


function log(text) {
    console.log(text);
    document.querySelector('#log').textContent += text + '\n';
}
