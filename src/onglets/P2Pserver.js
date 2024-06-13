// ******************************************************************************
// * @file    P2Pserver.js
// * @author  MCD Application Team
// *
//  ******************************************************************************
//  * @attention
//  *
//  * Copyright (c) 2022-2023 STMicroelectronics.
//  * All rights reserved.
//  *
//  * This software is licensed under terms that can be found in the LICENSE file
//  * in the root directory of this software component.
//  * If no LICENSE file comes with this software, it is provided AS-IS.
//  *
//  ******************************************************************************
import React, { useState, useEffect } from 'react';
import imagelightOffBlue from '../images/lightOffBlue.svg';
import imagelightOnBlue from '../images/lightOnBlue.svg';
import imagelightOffPink from '../images/lightOffPink.svg';
import imagelightOnPink from '../images/lightOnPink.svg';
import iconInfo from '../images/iconInfo.svg';
import { createLogElement } from "../components/Header";
import { OverlayTrigger, Popover } from 'react-bootstrap';
import nucleo from '../images/NUCLEO_board.png';
import dk1 from '../images/DK1.png';
import bluetooth from '../images/bluetoothLogo.svg';
import glucoselogo from '../images/glucose-meter.svg';
import htlogo from '../images/HTlogo.png';
import hrlogo from '../images/HRlogo.png';
import dtlogo from '../images/DTlogo.png';
import p2pslogo from '../images/P2PSlogo.png';




const P2Pserver = (props) => {
  let notifyCharacteristic;
  let ReadWriteCharacteristic;
  let rebootCharacteristic;
  let ReadCharacteristic ;
  const [deviceType, setDeviceType] = useState('nucleo');
  const [selectedApp, setSelectedApp] = useState('');
  const [selectedWay, setSelectedWay] = useState('cubeCLI');
  const [showCharacteristicDescription, setShowCharacteristicDescription] = useState(false);
  let characteristicFound = false;

 
  // Filtering the different datathroughput characteristics
  props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {
      case "0000fe42-8e22-4541-9d4c-21edae82ed19":
        notifyCharacteristic = element;
        notifyCharacteristic.characteristic.stopNotifications();
        break;
      case "0000fe41-8e22-4541-9d4c-21edae82ed19":
        ReadWriteCharacteristic = element;
        break;
        case "0000fe31-8e22-4541-9d4c-21edae82ed19":
          ReadCharacteristic = element;
          readInfoDevice();
          characteristicFound = true;
          break;
      case "0000fe11-8e22-4541-9d4c-21edae82ed19":
        rebootCharacteristic = element;
        break;
      default:
        console.log("# No characteristics found..");
    }
  });
  
  document.getElementById("readmeInfo").style.display = "none";

  // Write button handler
  async function onWriteButtonClick() {
    let myInput = document.getElementById('writeInput').value;
    let myWord = new Uint8Array(2);
    myWord[0] = myInput.slice(0, 2);
    myWord[1] = myInput.slice(2, 4);
    try {
      await ReadWriteCharacteristic.characteristic.writeValue(myWord);
      createLogElement(myWord, 1, "P2Pserver WRITE");
    }
    catch (error) {
      console.log('2 : Argh! ' + error);
    }
  }
  // Read button handler
  async function onReadButtonClick() {
    var value = await ReadWriteCharacteristic.characteristic.readValue();
    let statusWord = new Uint8Array(value.buffer);
    console.log(statusWord);
    document.getElementById('readLabel').innerHTML = "0x" + statusWord.toString();
    createLogElement(statusWord, 1, "P2Pserver READ");
  }

  //Start Characteristics And Upload Sections
  useEffect(() => {
    if (characteristicFound) {
      setShowCharacteristicDescription(true);
      readInfoDevice();
    }
  }, []);

  async function readInfoDevice() {
    var value = await ReadCharacteristic.characteristic.readValue();
    let statusWord = Array.from(new Uint8Array(value.buffer)).map(byte => byte.toString(16).padStart(2, '0')).join('-');
    let device, rev, board, hw, appv, app, hsv, hsvp1, hsvp2, apprep;
  
    console.log("Device Info", statusWord);
   
    let DeviceID = "0x" + statusWord.substring(3,5) + " " + statusWord.substring(0,2)  ; 
    let RevID = "0x" + statusWord.substring(9,11) + " " + statusWord.substring(6,8) ; 
    let BoardID = "0x" + statusWord.substring(12,14); 
    let HWp = "0x" + statusWord.substring(15,17); 
    let AppFWv = "0x" + statusWord.substring(18,20) + " " + "0x" + statusWord.substring(21,23) + " " + "0x" + statusWord.substring(24, 26) + " " + "0x" + statusWord.substring(27,29) + " " + "0x" + statusWord.substring(30, 32); 
    let AppFWID = "0x" + statusWord.substring(33, 35); 
    let HSv = "0x" + statusWord.substring(39,41) + " " + statusWord.substring(36,38); 
    let HSvp1 = "0x" + statusWord.substring(39,41);
    let HSvp2 = "0x" + statusWord.substring(36,38);

    console.log("----- Device Info -----");
    console.log("Device ID : ",DeviceID);
    console.log("Rev ID : ",RevID);
    console.log("Board ID : ",BoardID);
    console.log("HW package : ",HWp);
    console.log("FW package: ",AppFWv);
    console.log("App FW ID : ",AppFWID);
    console.log("Host Stack Version : ",HSv);

    console.log("-------------------------------");


    switch (DeviceID) {
      case '0x04 92':
        device = '5'
        break;
  
        case '0x 04 B0':
          device = '6'
          break;
      }

    switch (RevID) {
      case '0x10 00':
        rev = 'Rev A'
        break;
  
        case '0x20 00':
          rev = 'Rev B'
          break;
      }
    
    switch (BoardID) {
      case '0x8b':
        board = 'Nucleo WBA'
        updateDeviceType(board)
        break;
  
      case '0x8c':
        board = 'DK1 WBA'
        updateDeviceType(board)
        break;
      }
    
    switch (HWp) {
      case '0x00':
        hw = 'UFQFPN32'
        break;
  
      case '0x02':
        hw = 'UFQFPN48'
        break;

      case '0x03':
        hw = 'UFQFPN48-USB'
        break;

      case '0x05':
        hw = 'WLCSP88-USB'
        break;

      case '0x07':
        hw = 'UFBGA121-USB'
        break;

      case '0x09':
        hw = 'WLCSP41-SMPS'
        break;

      case '0x0a':
        hw = 'UFQFPN48-SMPS'
        break;

      case '0x0b':
        hw = 'UFQFPN48-SMPS-USB'
        break;

      case '0x0b':
        hw = 'UFQFPN48-SMPS-USB'
        break;

      case '0x0c':
        hw = 'VFQFPN68'
        break;

      case '0x0d':
        hw = 'WLCSP88-SMPS-USB'
        break;

      case '0x0f':
        hw = 'UFBGA121-SMPS-USB'
        break;



      }

      switch (HSvp2 ) {
        case '0x10':
         hsvp1 = 'Tag 0.15'
          break;

        case '0x0f':
          hsvp1 = 'Tag 0.16'
            break;

        }

        switch (HSvp1 ) {
          case '0x00':
           hsvp2 = 'Full Stack'
            break;
  
          case '0x10':
            hsvp2 = 'Basic Plus'
              break;

          case '0x20':
            hsvp2 = 'Basic Features'
              break;

          case '0x40':
            hsvp2 = 'Peripheral Only'
              break;
          
          case '0x80':
            hsvp2 = 'LL Only'
              break;

          case '0xA0':
            hsvp2 = 'LL Only Basic'
              break;

          case '0xxn':
            hsvp2 = 'branch n'
              break;
          
          case '0xxf':
            hsvp2 = 'debug version'
              break;
  
          }

          hsv = hsvp1 + " " +hsvp2

      switch (AppFWID) {
        case '0x83':
          app = 'Peer 2 Peer Server'
          apprep = 'BLE_p2pServer'
          break;
    
        case '0x89':
          app = 'Heart Rate'
          apprep = 'BLE_HeartRate'
          break;
  
        case '0x8a':
          app = 'Health Thermometer'
          apprep = 'BLE_HealthThermometer'
          break;

        case '0x88':
          app = 'Data Throughput'
          apprep = 'BLE_HealthThermometer'
          break;

        case '0x85':
          app = 'Peer 2 Peer Router'
          apprep = 'BLE_p2pRouter'
          break;

        case '0x87':
          app = 'Serial Com Peripheral'
          apprep = 'BLE_SerialCom_Peripheral'
          break;

        case '0x8d':
          app = 'Alert Notifiaction'
          apprep = 'BLE_AlertNotification'
          break;

        case '0x90':
          app = 'Find Me'
          apprep = 'BLE_FindMe'
          break;

        case '0x8f':
          app = 'Phone Alert Status'
          apprep = 'BLE_PhoneAlertStatus'
          break;

        case '0x8e':
          app = 'Proximity'
          apprep = 'BLE_Proximity'
          break;
        }

      appv = "v" + parseInt(statusWord.substring(18, 20), 16) + "." + parseInt(statusWord.substring(21, 23), 16) + "."  + parseInt(statusWord.substring(24, 26), 16) + "." + parseInt(statusWord.substring(27, 29), 16 ) + "." + parseInt(statusWord.substring(30, 32), 16 );
      

      console.log("----- Device Info -----");
      console.log("Device : ",device);
      console.log("Rev : ",rev);
      console.log("Board : ",board);
      console.log("HW package : ",hw);
      console.log("App Version: ",appv);
      console.log("App : ",app);
      console.log("Host Stack Version : ",hsvp1);
      console.log("Host Stack Type : ",hsvp2);

    console.log("-------------------------------");

    var dev = document.getElementById("dev");
    dev.innerText = board + device;
    var revs = document.getElementById("revs");
    revs.innerText = rev;
    var hwp = document.getElementById("hwp");
    hwp.innerText = "FW package : " + hw;
    var hsvs1 = document.getElementById("hsvs1");
    hsvs1.innerText = "Host Stack Version : " + hsvp1;
    var hsvs2 = document.getElementById("hsvs2");
    hsvs2.innerText = "Host Stack Type : " + hsvp2;
    var apps = document.getElementById("apps");
    apps.innerText = app ;
    var appvs = document.getElementById("appvs");
    appvs.innerText = "App FW Version : " + appv;

    const latestVersion = await getLatestVersion(apprep);

    const versionRecentRow = document.getElementById('versionrecent');
    const versionUpdateRow = document.getElementById('versionupdate');
  
    if (isLatestVersion(appv, latestVersion)) {
      versionRecentRow.style.display = '';
      versionUpdateRow.style.display = 'none';
    } else {
      versionRecentRow.style.display = 'none';
      versionUpdateRow.style.display = '';
    }
  
  }

  async function getLatestVersion(appFolderName) {
    const url = `${githubBaseUrl}${appFolderName}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API responded with status code ${response.status}`);
      }
      const files = await response.json();
      const versionRegex = /(v\d+\.\d+\.\d+)\.bin/;

      let versions = files
        .map(file => {
          const match = file.name.match(versionRegex);
          return match ? match[1] : null;
        })
        .filter(version => version !== null)
        .map(version => formatVersion(version)) 
        .sort((a, b) => b.localeCompare(a)); 
        console.log("Latest Version: ",versions[0]);

      return versions[0];
    } catch (error) {
      console.error('Error fetching the latest version:', error);
    }
}


  function formatVersion(version) {
    const versionRegex = /(v\d+\.\d+\.\d+)/; 
    const match = version.match(versionRegex);
    if (match && match[1]) {
      return match[1] + '.0.0'; 
    }
    return null; 
}
  

  function isLatestVersion(current, latest) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
  
    for (let i = 0; i < currentParts.length; i++) {
      if (currentParts[i] < latestParts[i]) {
        return false;
      } else if (currentParts[i] > latestParts[i]) {
        return true;
      }
    }
    return true;
  }

  const isOtaSelected = selectedWay === 'ota';
  const isAppDisabledForOta = (app) => isOtaSelected && (app === 'app1' || app === 'app3');

  const handleSetSelectedWay = (way) => {
    setSelectedWay(way);

    if (way !== selectedWay) {

      setSelectedApp('');
      const versionSelect = document.getElementById('selectedVersion');
      versionSelect.innerHTML = '<option disabled selected>Choose app first</option>';
    }
    
    if (way === 'ota' && (selectedApp === 'app1' || selectedApp === 'app3')) {
      setSelectedApp('');
    }

    if (way === 'cubeCLI') {
      setSelectedApp('');
    }
  };

  function updateDeviceType(type) {
    setDeviceType(type);
  }
  


  function promptForProgrammerPath() {
    return prompt('Please enter the path to STM32CubeProgrammer:', 'C:\\Program Files\\STMicroelectronics\\STM32Cube\\STM32CubeProgrammer\\bin\\STM32_Programmer_CLI.exe');
  }

  function askToDownloadServer() {
    const downloadLink = document.createElement('a');
    downloadLink.href = 'https://github.com/kenzarul/Web_Bluetooth_App_WBA/raw/main/upload-cubeprogrammer-server.exe';
    downloadLink.setAttribute('download', ''); 
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    alert('Please click on the downloaded "upload-cubeprogrammer-server.exe" file to run the server.');
}



  async function downloadByCubeProgrammerCLI() {
    try {
      const selectedVersion = document.getElementById('selectedVersion').value;
      const appName = appFolderMap[selectedApp];
      const binaryFileName = `${appName}v${selectedVersion}.bin`;
      const githubRawUrl = `https://api.github.com/repos/kenzarul/STM32WBA_Binaries/contents/${appName}/${binaryFileName}`;
      const apiResponse = await fetch(githubRawUrl);
      if (!apiResponse.ok) {
        throw new Error(`Failed to fetch the binary file metadata: ${apiResponse.statusText}`);
      }
      const metadata = await apiResponse.json();
      const downloadUrl = metadata.download_url;
  
      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch the binary file: ${fileResponse.statusText}`);
      }
      const blob = await fileResponse.blob();
      const programmerPath = promptForProgrammerPath();
  

      const formData = new FormData();
      formData.append('binaryFile', blob, binaryFileName);
      formData.append('programmerPath', programmerPath);
  

      const uploadResponse = await fetch('http://localhost:4000/upload', {  
        method: 'POST',
        body: formData
      });
  
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload the binary file: ${uploadResponse.statusText}`);
      }
  
      const message = await uploadResponse.text();
      console.log(message);
      alert('Download complete and memory flashed successfully.'); 
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred: ' + error.message); 
    }
  }

  async function downloadByOTA() {
    alert('Cannot use download by OTA as it is  still in developpement.'); 
  }

  function handleDownloadClick() {
    if (selectedWay === 'cubeCLI') {
      downloadByCubeProgrammerCLI();
    } else if (selectedWay === 'ota') {
      downloadByOTA();
    } else {
    
      alert('Please select a method for uploading.');
    }
  }
  

  const githubBaseUrl = 'https://api.github.com/repos/kenzarul/STM32WBA_Binaries/contents/';

  const appFolderMap = {
    'app0': 'BLE_p2pServer',
    'app1': 'BLE_HealthThermometer',
    'app2': 'BLE_HeartRate',
    'app3': 'BLE_DataThroughput_Server',
    'app0_ota': 'BLE_p2pServer_ota',
    'app2_ota': 'BLE_HeartRate_ota',
    
  };
  
  async function updateVersionOptions(selectedApp) {
    const folderName = selectedWay === 'ota' ? `${selectedApp}_ota` : selectedApp;
    const directory = appFolderMap[folderName];
    if (!folderName) {
      console.error('Invalid application selection');
      return;
    }
  
    const url = `${githubBaseUrl}${directory}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API responded with status code ${response.status}`);
      }
      const files = await response.json();
      const versionRegex = /v(\d+\.\d+\.\d+)\.bin/; 
  
      const versions = files
        .map(file => {
          const match = file.name.match(versionRegex);
          return match ? match[1] : null;
        })
        .filter(version => version !== null);
  
      const versionSelect = document.getElementById('selectedVersion');
      versionSelect.innerHTML = ''; 
  
      versions.forEach(version => {
        const option = document.createElement('option');
        option.value = version;
        option.textContent = "v"+version;
        versionSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error fetching the list of versions:', error);
    }
  }
  //End Characteristics And Upload Sections


  async function onEnableLightClick() {
    let imgStatus = document.getElementById('imageLightPink').getAttribute('src')
    let myWord;
    try {
      if (imgStatus === imagelightOffBlue) {
        myWord = new Uint8Array(2);
        myWord[0] = parseInt('01', 8);
        myWord[1] = parseInt('01', 8);
        await ReadWriteCharacteristic.characteristic.writeValue(myWord);
        createLogElement(myWord, 1, "P2Pserver WRITE");
        document.getElementById('enableLightButton').innerHTML = "Light ON";
        document.getElementById('imageLightPink').src = imagelightOnBlue;
      } else {
        myWord = new Uint8Array(2);
        myWord[0] = parseInt('01', 8);
        myWord[1] = parseInt('00', 8);
        await ReadWriteCharacteristic.characteristic.writeValue(myWord);
        createLogElement(myWord, 1, "P2Pserver WRITE");
        document.getElementById('enableLightButton').innerHTML = "Light OFF";
        document.getElementById('imageLightPink').src = imagelightOffBlue;
      }
    }
    catch (error) {
      console.log('2 : Argh! ' + error);
    }
  }

  // Notify button click handler
  async function onNotifyButtonClick() {
    let notifStatus = document.getElementById('notifyButton').innerHTML;
    if (notifStatus === "Notify OFF") {
      console.log('Notification ON');
      notifyCharacteristic.characteristic.startNotifications();
      notifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
      document.getElementById('notifyButton').innerHTML = "Notify ON"
      createLogElement(notifyCharacteristic, 3, "P2Pserver ENABLE NOTIFICATION ");
    } else {
      notifyCharacteristic.characteristic.stopNotifications();
      console.log('Notification OFF');
      document.getElementById('notifyButton').innerHTML = "Notify OFF"
      createLogElement(notifyCharacteristic, 3, "P2Pserver DISABLE NOTIFICATION ");
    }
  }

  // notification handler
  function notifHandler(event) {
    console.log("Notification received");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
    createLogElement(buf, 1, "P2Pserver NOTIFICATION RECEIVED");
    if (buf[1].toString() === "1") {
      document.getElementById('imageLightBlue').src = imagelightOnPink;
    } else {
      document.getElementById('imageLightBlue').src = imagelightOffPink;
    }
  }

  // Tooltips

  const popoverNotifyButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Enable the reception of notifications from the connected device. <br />
      Example : <br />
      Enable the notifications then push SW1. 
    </Popover>
  );

  const popoverEnableLightButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Turn on/off the led on the device. <br />
      <strong>Tip :</strong> You can also click on the pink led
    </Popover>
  );

  const popoverWriteButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Send a value to the connected device. <br />
      Example : <br />
      0x 0101 to turn ON the led<br />
      0x 0100 to turn OFF the led
    </Popover>
  );
  
  const popoverReadButton = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Read value written on the connected device. <br />
      Example : <br />
      0x 1,1 : led is on<br />
      0x 1,0 : led is off
    </Popover>
  );


  return (
      <div className="container-fluid">
        <div className="tempPannel">

          <div className="ALL__container">
            <div className="main-content">

              {showCharacteristicDescription && (

              <div>

                <div className="Char_titlebox">
                  <h3><strong>Characteristic Description</strong></h3>
                </div>
          

                  <div class="Char__container container grid">

                    <div class="Chartitle__card2">
                      <div class="Char__container2 container grid">
                        <div>
                          <img src={deviceType === 'DK1 WBA' ? dk1 : nucleo} alt="" className="boardImage"></img>
                        </div>
                        <div>
                          <br></br>
                          <h1><span id='dev' ></span></h1>
                          <hr class="divider"></hr>
                          <h3><span id='revs' > </span></h3>
                          <h3><span id='hwp' > </span></h3>
                          <br></br>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div class="Chartitle__card3">
                        <div class="header-content">
                          <img src={bluetooth} alt="" className="bluetoothLogo">
                          </img><h1><span id='apps' > </span></h1>
                        </div>
                        <h3><span id='appvs' > </span></h3>
                      </div>

                      <div class="Chartitle__card4">
                        <h3><span id='hsvs1' > </span></h3>
                        <h3><span id='hsvs2' > </span></h3>
                      </div>
                    </div>

                  </div>

                <table className='InfoTable'>
                  <tbody>
                    <tr><th className='InfoTableTh'><box-icon name='info-circle' size='sm' type='solid' color='white' class='infoLogo' ></box-icon> Information</th></tr>
                    <tr id="versionrecent" style={{display: 'none'}}><th className='InfoTableTd'>This is the latest version of the application.</th></tr>
                    <tr id="versionupdate" style={{display: 'none'}}><th className='InfoTableTd'>The latest version of the application is available.</th></tr>
                  </tbody>
                </table>
             </div>
            )}

        <div className="container">
          <div className='row justify-content-center mt-3'>
            <div className='col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
              <div className='d-flex flex-row'>
              <button className="defaultButton w-100" type="button" onClick={onEnableLightClick} id="enableLightButton">Light OFF</button>
                <span>
                  <OverlayTrigger
                    trigger={['hover', 'focus']}
                    placement="bottom"
                    overlay={popoverEnableLightButton}>
                    <img className="iconInfo" src={iconInfo}></img>
                  </OverlayTrigger>
                </span>
              </div>
            </div>
            <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
              <div className='d-flex flex-row'>
              <button className="defaultButton w-100" type="button" onClick={onNotifyButtonClick} id="notifyButton">Notify OFF</button>
                <span>
                  <OverlayTrigger
                    trigger={['hover', 'focus']}
                    placement="bottom"
                    overlay={popoverNotifyButton}>
                    <img className="iconInfo" src={iconInfo}></img>
                  </OverlayTrigger>
                </span>
              </div>              
            </div>
            
          </div>
          <div className='row justify-content-center mt-3'>
            <div className='col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
              <div class="input-group">
                <span class="input-group-text" id="button-write">0x</span>
                <input type="text" class="form-control" placeholder="..." aria-describedby="button-write" maxLength="4" id="writeInput"></input>
                <button class="defaultButton" type="button" id="button-write" onClick={onWriteButtonClick}>Write</button>
                <span>
                  <OverlayTrigger
                    trigger={['hover', 'focus']}
                    placement="bottom"
                    overlay={popoverWriteButton}>
                    <img className="iconInfo" src={iconInfo}></img>
                  </OverlayTrigger>
                </span>
              </div>
            </div>

            <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
              <div className="input-group">
                <span className="input-group-text text-center form-control" id="readLabel">0x....</span>
                <button className="defaultButton" type="button" onClick={onReadButtonClick} aria-describedby="readLabel">Read</button>
                <span>
                  <OverlayTrigger
                    trigger={['hover', 'focus']}
                    placement="bottom"
                    overlay={popoverReadButton}>
                    <img className="iconInfo" src={iconInfo}></img>
                  </OverlayTrigger>
                </span>
              </div>             
            </div>
          </div>
          <div className='row justify-content-center'>
            <div className='col-6 col-md-3 col-lg-3 justify-content-center'>
              <img src={imagelightOffBlue} onClick={onEnableLightClick} id='imageLightPink' className="img-fluid img-thumbnail "></img>
            </div>
            <div className='col-6 col-md-3 col-lg-3 justify-content-center'>
              <img src={imagelightOffPink} id='imageLightBlue' className="img-fluid img-thumbnail " ></img>
            </div>
          </div>
          </div>
          </div>

          <div className="sidebar">
            <div class="Chartitle__card5">
              
              <h1>Choose The Upload Method :</h1>

              <div class="custom-divider"></div>

              <div class="way-list-container">

                <label className={`way-list-item ${selectedWay=== 'cubeCLI' ? 'active' : ''}`}>
                <input type="radio" name="way" value="cubeCLI" checked={selectedWay === 'cubeCLI'}  onChange={() => handleSetSelectedWay('cubeCLI')} />
                <span className="way-list-text">STM32CubeProgrammer CLI</span></label>

                <label className={`way-list-item ${selectedWay=== 'ota' ? 'active' : ''}`}>
                <input type="radio" name="way" value="ota" checked={selectedWay === 'ota'}  onChange={() => handleSetSelectedWay('ota')}  />
                <span className="way-list-text">OTA</span></label>

              </div>

              <div class="custom-divider"></div>
              <h1>Select The Available Application</h1>

             <div class="custom-divider"></div>

             <div class="app-list-container">

              <label className={`app-list-item ${selectedApp === 'app0' ? 'active' : ''}`}>
              <input type="radio" name="application" value="app0" checked={selectedApp === 'app0'}  onChange={() => { setSelectedApp('app0'); updateVersionOptions('app0'); setSelectedApp('app0'); updateVersionOptions('app0');}} />
              <img src={p2pslogo} className="appsLogo"></img>
              <a href="https://wiki.st.com/stm32mcu/wiki/Connectivity:STM32WBA_Peer_To_Peer" target="_blank" className="app-list-link">
              <span className="app-list-text">Peer2Peer Server</span></a></label>

              <label className={`app-list-item ${selectedApp === 'app1' ? 'active' : ''} ${isAppDisabledForOta('app1') ? 'disabled' : ''}`}>
              <input type="radio" name="application" value="app1" checked={selectedApp === 'app1'} disabled={isAppDisabledForOta('app1')}  onChange={() => { setSelectedApp('app1'); updateVersionOptions('app1');setSelectedApp('app1'); updateVersionOptions('app1'); }} />
              <img src={htlogo} className={`appsLogo ${isAppDisabledForOta('app1') ? 'logo-disabled' : ''}`}></img>
              <a href="https://wiki.st.com/stm32mcu/wiki/Connectivity:STM32WBA_Health_Thermometer" target="_blank" className="app-list-link">
              <span className={`app-list-text ${isAppDisabledForOta('app1') ? 'disabled' : ''}`}>Health Temperature</span></a></label>

              <label className={`app-list-item ${selectedApp === 'app2' ? 'active' : ''}`}>
              <input type="radio" name="application" value="app2" checked={selectedApp === 'app2'} onChange={() => { setSelectedApp('app2'); updateVersionOptions('app2'); setSelectedApp('app2'); updateVersionOptions('app2');}}/>
              <img src={hrlogo} className="appsLogo"></img>
              <a href="https://wiki.st.com/stm32mcu/wiki/Connectivity:STM32WBA_HeartRate" target="_blank" className="app-list-link">
              <span className="app-list-text">Heart Rate</span></a></label>

              <label className={`app-list-item ${selectedApp === 'app3' ? 'active' : ''} ${isAppDisabledForOta('app3') ? 'disabled' : ''}`}>
              <input type="radio" name="application" value="app3" checked={selectedApp === 'app3'} disabled={isAppDisabledForOta('app3')} onChange={() => { setSelectedApp('app3'); updateVersionOptions('app3');setSelectedApp('app3'); updateVersionOptions('app3'); }}/>
              <img src={dtlogo} className={`appsLogo ${isAppDisabledForOta('app3') ? 'logo-disabled' : ''}`}></img>
              <a href="https://wiki.st.com/stm32mcu/wiki/Connectivity:STM32WBA_Data_Throughput" target="_blank" className="app-list-link">
              <span className={`app-list-text ${isAppDisabledForOta('app3') ? 'disabled' : ''}`}>Data Throughput</span></a></label>

              </div>

              <div class="custom-divider"></div>

              <h1>Select The Available Version</h1>

              <div class="Chartitle__card6">
                <select id="selectedVersion">
                <option disabled selected>Choose app first</option>
                </select>
              </div>

              <div class="custom-divider"></div>

              <h1>Install And Open The Server First Before Uploading A New Application</h1>

              <div className="Charbuttitle__card">
                <button onClick={askToDownloadServer}>Install Server</button>
              </div>

              <div class="custom-divider"></div>

              <div className="Charbuttitle__card">
                <button onClick={handleDownloadClick}>Upload App</button>
              </div>

            </div>
          </div>
          </div>
        </div>
      </div>
     
  );
};

export default P2Pserver;