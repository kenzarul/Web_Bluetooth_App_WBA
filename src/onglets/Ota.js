// ******************************************************************************
// * @file    Ota.js
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
import { Buffer } from 'buffer';
import { createLogElement, startOtaUpdate} from "../components/Header";
import { OverlayTrigger, Popover } from 'react-bootstrap';
import iconInfo from '../images/iconInfo.svg';

const REBOOT = 1;
const READY_TO_RECEIVE = 2;
const ERROR_NO_FREE = 3;
const CHUNK_LENGTH = 240;
const SECTOR_SIZE = 8*1024;

let writeAddressCharacteristic;
let indicateCharacteristic;
let writeWithoutResponseCharacteristic;
let fileContent;
let fileLength;
let nbSector;
let nbSectorHex;
let uploadAction;
let readyToReceive = false;
let manualySettingNbSector = false;

const Ota = (props) => {
    // Filtering the different datathroughput characteristics
    props.allCharacteristics.map(element => {
        switch (element.characteristic.uuid) {
            case "0000fe22-8e22-4541-9d4c-21edae82ed19":
                writeAddressCharacteristic = element;
                break;
            case "0000fe23-8e22-4541-9d4c-21edae82ed19":
                indicateCharacteristic = element;
                break;
            case "0000fe24-8e22-4541-9d4c-21edae82ed19":
                writeWithoutResponseCharacteristic = element;
                break;
            default:
                console.log("# No characteristics find..");
        }
    });

    const [githubUrl, setGithubUrl] = useState(localStorage.getItem('githubUrl') || '');
    const [binaryFileName, setBinaryFileName] = useState(''); 
    const [manualFileSelection, setManualFileSelection] = useState(false);
    const [selectedAction, setSelectedAction] = useState('application')
  
    useEffect(() => {
      const handleGithubUrlUpdate = (event) => {
        setGithubUrl(event.detail);
        const fileName = event.detail.split('/').pop();
        setBinaryFileName(fileName);
        fetchBinaryFromGitHub(event.detail);
        setManualFileSelection(false); // Reset manual file selection when a new GitHub URL is set
      };
      window.addEventListener('githubUrlUpdated', handleGithubUrlUpdate);
    
      if (githubUrl) {
        fetchBinaryFromGitHub(githubUrl);
        const fileName = githubUrl.split('/').pop();
        setBinaryFileName(fileName);
        setSelectedAction('application');
        uploadAction = "002";
        if (selectedAction === 'application') {
          document.getElementById("applicationSelectFilePart").style.display = "block";
        }
      }
    
      return () => {
        window.removeEventListener('githubUrlUpdated', handleGithubUrlUpdate);
      };
    }, [githubUrl]);

    
  document.getElementById("readmeInfo").style.display = "none";

  const fetchBinaryFromGitHub = async (url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.content) {
        const binaryContent = Buffer.from(data.content, 'base64');
        fileContent = new Uint8Array(binaryContent);
        fileLength = fileContent.length;
      }
    } catch (error) {
      console.error("Error fetching binary from GitHub: ", error);
    }
    // Reset manual file content when a new GitHub URL is set
    if (manualFileSelection) {
      fileContent = null;
      fileLength = 0;
      setManualFileSelection(false);
    }
  };
   
  // Authorize the reception of indications / notifications
    console.log('Indications ON');
    indicateCharacteristic.characteristic.startNotifications();
    indicateCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
    createLogElement(indicateCharacteristic, 3, "OTA ENABLE NOTIFICATION");


    // Notification / indications handler
    function notifHandler(event) {
        console.log("Notification / Indication :> received");
        var buf = new Uint8Array(event.target.value.buffer);
        console.log(buf);
        if (buf[0] === REBOOT){
          document.getElementById("uploadButton").innerHTML = `<div>Programming... Please wait</div> <div class="spinner-border text-success" role="status" style={float:right}></div>`
        }
        else if(buf[0] == READY_TO_RECEIVE){
          readyToReceive = true;
          sliceAndSend();
        }else if (buf[0] == ERROR_NO_FREE){
          console.log("Error no Free");
        }
        createLogElement(buf, 2, "OTA NOTIFICATION");
    }

    // Send to device the action to be ready for the update of the firmware
    async function writeAddress() {
        let address = document.getElementById("startSectorInput").value
        let hexStringFistPart = address.substring(0,2);
        let hexStringSecondePart = address.substring(2,4);
        let hexStringThirdPart = address.substring(4,6);

        hexStringFistPart = parseInt(hexStringFistPart, 16);
        hexStringSecondePart = parseInt(hexStringSecondePart, 16);
        hexStringThirdPart = parseInt(hexStringThirdPart, 16);
        nbSectorHex = nbSector.toString(16);

        // dec : 002 008 032 000
        // hex : 02 08 20 00
        let myWord = new Uint8Array(5);
        myWord[0] = uploadAction; // Action 
        myWord[1] = hexStringFistPart; // Address
        myWord[2] = hexStringSecondePart; // Address
        myWord[3] = hexStringThirdPart; // Address
        myWord[4] = nbSectorHex; // Address
        try {
            await writeAddressCharacteristic.characteristic.writeValue(myWord);
            console.log("Writing >> " + myWord);
            createLogElement(myWord, 2, "OTA WRITE");
        }
        catch (error) {
            console.log('2 : Argh! ' + error);
        }
    }

    function indicationTimeout() {
      document.getElementById("uploadButton").innerHTML = `<div>Something went wrong... Please reset the device and wait for disconnection</div> <div class="spinner-border text-danger" role="status" style={float:right}></div>`
    }
    

    async function onUploadButtonClick() {
      if(manualySettingNbSector == false){
        calculateNbSector();
      } else {
        // The user set manualy the number of sector
        fileLength = fileContent.length;
        nbSector = document.getElementById("nbSector").value
        console.log("Manualy set the number of sector  = ")
        console.log(nbSector);
      }
      
      document.getElementById("uploadButton").innerHTML = `<div>Uploading... Please wait</div> <div class="spinner-border text-danger" role="status" style={float:right}></div>`

      writeAddress();
      sliceAndSend();
    }

    async function sliceAndSend(){
      let progressUploadBar = document.getElementById('progressUploadBar');
      let start = 0;
      let end = CHUNK_LENGTH;
      let sub;
      let totalBytes = 0;
  
      if(readyToReceive == true){
        // Slice the fileContent (the binary file) into small chucks of CHUNK_LENGTH
        // And send them to the device
        // Start the timer
        var startTime = performance.now()
        for (let i = 0; i < fileLength/CHUNK_LENGTH; i++) {
            sub = fileContent.slice(start, end);
            console.log(sub);
            start = end;
            end += CHUNK_LENGTH;
            await writeWithoutResponseCharacteristic.characteristic.writeValue(sub)
            // createLogElement(sub, 2, "OTA WRITE");
            totalBytes += sub.byteLength
            console.log("progressUploadBar");
            console.log(progressUploadBar);
            progressUploadBar.setAttribute('style','width:'+Number((totalBytes * 100) / fileLength)+'%');
            console.log(i + "> (" + totalBytes + ") writing " + sub.byteLength + ' bytes..');
        }

        // Send to device the action : file is finish to upload
        let FileUploadFinished = new Uint8Array(1);
        FileUploadFinished[0] = "007";
        await writeAddressCharacteristic.characteristic.writeValue(FileUploadFinished);
        console.log(FileUploadFinished);
        createLogElement(FileUploadFinished, 2, "OTA WRITE");
        // Stop the timer
        var endTime = performance.now()
        console.log(`The firmware update took : ${endTime - startTime} milliseconds`);
        let uploadButton = document.getElementById("uploadButton")
        uploadButton.disabled = true;
        uploadButton.innerHTML = `<div> Programming... Please wait</div> <div class="spinner-border" role="status" style={float:right}></div>`
        // setTimeout(indicationTimeout, 30000)
      } else {
        console.log(" Not ready to receive ...");
      }
    }

    async function calculateNbSector(){
      fileLength = fileContent.length;
      nbSector = fileLength/SECTOR_SIZE;
      nbSector = Math.ceil(nbSector);
      document.getElementById("nbSector").value = nbSector;

      console.log("file length = ");
      console.log(fileLength);
      console.log("NbSector = ");
      console.log(nbSector);
    }

  async function onActionRadioButtonClick(event){
    const actionValue = event.target.value;
    setSelectedAction(actionValue);
    document.getElementById('configDiv').style="display:block";
    let selectedAction = document.getElementsByName("selectAction");
    for (let i = 0; i < selectedAction.length; i++){
      if(selectedAction[i].checked){
        selectedAction = selectedAction[i].value;
      }
  }
    console.log(selectedAction);
    let actionChoice = document.getElementById("startSectorInput");
    switch (selectedAction){
      case 'userData':
        document.getElementById("userDataSelectFilePart").style="display:block";
        document.getElementById("applicationSelectFilePart").style="display:none";
        uploadAction = "001";
        actionChoice.value = "0F6000";
        break;
      case 'application':
        document.getElementById("userDataSelectFilePart").style="display:none";
        document.getElementById("applicationSelectFilePart").style="display:block";
        uploadAction = "002";
        actionChoice.value = "080000";

        break;
    }
  }

  async function showFile(input) {
    console.log("FileLoader");
    let uploadButton = document.getElementById("uploadButton");
    uploadButton.disabled = true;
    fileContent = input.target.files[0];
    let reader = new FileReader();
    reader.readAsArrayBuffer(fileContent);
    reader.onload = async function () {
        let uint8View = new Uint8Array(reader.result);
        console.log(uint8View);
        fileContent = uint8View;
        // Update the fileLength as well if needed
        fileLength = fileContent.length;
    }
    reader.onerror = function (error) {
        console.log('Error: ', error);
    };
    uploadButton.disabled = false;
  }

  function checkBoxClicForNbSector() {
    // Get the checkbox
    var checkBox = document.getElementById("checkboxNbSector");
    var inputSector = document.getElementById("nbSector");
        
    // If the checkbox is checked, display the output text
    if (checkBox.checked == true){
      manualySettingNbSector = true;
      inputSector.disabled = false;
      console.log("manual Nb Sector");
    } else {
      manualySettingNbSector = false;
      inputSector.disabled = true;
      console.log("auto Nb Sector");
    }
  }
 
  const popoverUserData = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> In contains the User Data that need to be kept along with firmware update.​
    </Popover>
  );
  
  const popoverApplicationBinary = (
    <Popover id="popover-trigger-hover-focus" title="Popover bottom">
      <strong>Info :</strong> Choose either a file from your device or file fetch from the STMicroelectronics Hotspot. <br />
      Then choose the first sector address. (default 0x07C000).
    </Popover>
  );


    return (
    <div className="container-fluid">
        <div className="container">
          
          <div className="input-group">
            <div className="input-group-text">
              <input className="form-check-input mt-0" type="radio" value="userData" name='selectAction' onClick={onActionRadioButtonClick} ></input>
            </div>
            <input type="text" disabled={true} className="form-control" aria-label="Text input with radio button" value="User Configuration Data Update"></input>
            </div>
          <div className="input-group">
            <div className="input-group-text">
              <input className="form-check-input mt-0" type="radio" value="application" name='selectAction' onClick={onActionRadioButtonClick} checked={selectedAction === 'application'} ></input>
            </div>
            <input type="text" disabled={true} className="form-control" aria-label="Text input with radio button" value="Application Update"></input>
          </div>

          <div id='userDataSelectFilePart' style={{"display": "none"}}>
            <div id='userDataBinaryList' style={{"display": "block"}}>
              <h3>User Configuration Data
                <OverlayTrigger
                  trigger={['hover', 'focus']}
                  placement="bottom"
                  overlay={popoverUserData}>
                  <img className="iconInfo" src={iconInfo} ></img>
                </OverlayTrigger>
              </h3>
            </div>
          </div>
          
          <div id='applicationSelectFilePart' style={{"display": "block"}}>
            <div id='applicationBinaryList' style={{"display": "block"}}>
              <h3>Application
                <OverlayTrigger
                  trigger={['hover', 'focus']}
                  placement="bottom"
                  overlay={popoverApplicationBinary}>
                  <img className="iconInfo" src={iconInfo} ></img>
                </OverlayTrigger>
              </h3>
            </div>
          </div>

          <div id='configDiv'style={{"display": "block"}}>

          <div className="input-group mb-3">
              <label>Choosing manually the binary file &nbsp;</label> 
              <label class="containerCheckBox" >
              <input type="checkbox" id="manualFileCheckbox" onChange={() => setManualFileSelection(!manualFileSelection)} />
              <span class="checkmark"></span>
              </label>
          </div>

          {manualFileSelection ? (
            <div className="mt-3 mb-3">
              <input className="form-control fileInput" type="file" onChange={(e) => showFile(e)}></input>
            </div>
            ) : githubUrl && (
            <div className="input-group mb-3">
            <span className="input-group-text">Selected Binary File</span>
            <span className="input-group-text"><strong>{binaryFileName}</strong></span>
            </div>
          )}

            <div className="input-group mb-3">
              <span className="input-group-text" id="startSectorChoise">Address 0x</span>
              <input type="text" className="form-control" placeholder="..." aria-describedby="startSectorChoise" maxLength="6" id="startSectorInput" ></input>
            </div>
            <div className="input-group mb-3">
              <label>Setting manualy the number of sector &nbsp;</label> 
              <label class="containerCheckBox" onClick={checkBoxClicForNbSector}>
                <input type="checkbox"id="checkboxNbSector" />
                <span class="checkmark"></span>
              </label>
            </div>
            
            <div className="input-group mb-3">
              <span className="input-group-text" id="nbSectorChoise" >Nb Sector</span>
              <input type="text" disabled="true" className="form-control" placeholder="..." aria-describedby="nbSectorChoise" maxLength="3" id="nbSector" defaultValue={"23"}></input>
            </div>

            <button className="secondaryButton w-100 mb-3 has-spinner" type="button" onClick={onUploadButtonClick} id="uploadButton" disabled={false}>Upload</button>
            <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" id='progressUploadBar' aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style={{width: "0%"}}></div>
            </div>
          </div>
        </div>
    </div>

  );
};

export default Ota;