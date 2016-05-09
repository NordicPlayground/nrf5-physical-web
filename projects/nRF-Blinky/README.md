# nRF52 Blinky Web App
This is a Web App demonstrating the same functionality as the [nRF Blinky Android App](https://play.google.com/store/apps/details?id=no.nordicsemi.android.nrfblinky).

## Instructions
* Connect your nRF52 Development Kit with USB to your Win/OSX/Linux PC. It will show up as a JLINK drive.
* Drag and drop the nRF52_Blinky.hex file onto the JLINK drive to flash the firmware.
* Open this URL in a Web Bluetooth API compatible browser: https://ketile.github.io/physical-web/nRF-Blinky/
* Click the connect button and choose Nordic_Blinky from the device chooser menu.
* Click the ON/OFF button to turn LED2 on the nRF52 DK on/off.
* Press Button 1 on the nRF52 DK to send notifications to the Web App.

## Source code
* The nRF52 firmware source code is available in the [nRF52-ble-app-lbs](https://github.com/NordicSemiconductor/nRF52-ble-app-lbs) repository.
* gThe Android App source code is available in the [Android-nRF-Blinky](https://github.com/NordicSemiconductor/Android-nRF-Blinky) repository.

## LED Button Service UUIDs
* LBS Service `00001523-1212-efde-1523-785feabcd123`
* Button Characteristic `00001524-1212-efde-1523-785feabcd123`
* LED Characteristic `00001525-1212-efde-1523-785feabcd123`
