import * as messaging from "messaging";
import clock from "clock";
import document from "document";
import {outbox} from "file-transfer";
// import {zeroPad} from "../common/utils"
import { settingsStorage } from "settings";
import { me } from "companion";

/////////////////// STARTUP SEQUENCE //////////////////
console.log("Companion Started");
// setTimeout(getTides, 2000); // fire up two seconds after starting clock face
// setInterval(getTides, 86400000); // update daily
setTimeout(testStation(getIDs()[0],getIDs()[1]), 2000); // fire 2 seconds after companion starts. Seems silly. why not just do it straight out?
setInterval(testStation(getIDs()[0],getIDs()[1]), 24*60*60*1000); // update daily

function getIDs() {
  let IDs = []
  try {
    IDs = [JSON.parse(settingsStorage.getItem("regionInput")).selected, JSON.parse(settingsStorage.getItem("stationInput")).name]
  } catch (e) { IDs = [0, 9414290] }
  return IDs
}

// IF SETTINGS CHANGE, FETCH AND FILE TRANSFER DATA
settingsStorage.onchange = function(evt) {
  // getTides()
  testStation(getIDs()[0],getIDs()[1])
}

// IF SETTINGS CHANGED WHEN COMPANION WAS ASLEEP, FETCH AND FILE TRANSFER DATA
if (me.launchReasons.settingsChanged) {
  // getTides()
  testStation(getIDs()[0],getIDs()[1])
}


function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

// MAKE THE URL TO GO FETCH
function urlMaker(stationID, dataBase) {
  var today = new Date();
  if (dataBase == 'NOAA') {
    var url = "https://tidesandcurrents.noaa.gov/api/datagetter?begin_date=" + today.getFullYear().toString() + zeroPad(today.getMonth()+1) + zeroPad(today.getDate()) + '&range=196&station=' + stationID + '&product=predictions&datum=mllw&units=english&time_zone=lst_ldt&application=web_services&format=json&interval=hilo'
  } else if (dataBase == 'UKHO') {
    var url = "https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/" + stationID + "/TidalEvents"
  }
  return url 
}


//////////////// FETCH DATA //////////////////
function fetchTides(regionID, stationID, requested = false) {
  // NOAA
  if (regionID == 0) {
    fetch(urlMaker(stationID, 'NOAA'))
    .then(function (response) {
        response.json()
        .then(function(data) {
          // build tide array
          var tides = []
          for (let i = 0; i < Object.keys(data.predictions).length; i++) {
            // year, month, day, hour, minute, H/L
            tides.push(data.predictions[i].t.replace(/ /gi,'T') + data.predictions[i]['type'])
          };
          if (requested == true) { // send via messaging if the app requested it
            returnTideData(tides);
          } else {
            sendTides(tides);
          }
        });
    })
    .catch(function (err) {
      settingsStorage.setItem("error", 1);
      console.log("Error fetching tides: " + err);
    });
    
  // UKHO
  } else if (regionID == 1) {
    var keyHead = new Headers();
    keyHead.append("Ocp-Apim-Subscription-Key", "fb078c29940a460ca4dab1a5172d2c02");
    let initObject = {
      headers: keyHead
    };
    fetch(urlMaker(stationID, 'UKHO'), initObject)
    .then(function (response) {
      console.log(response.status)
        response.json()
        .then(function(data) {
          // build tide array
          var tides = []
          for (let i = 0; i < data.length; i++) {
            // console.log(data[i].DateTime)
            // year, month, day, hour, minute
            let u = data[i].DateTime.slice(0,16)
            // add L for low tide or H for high tide
            if (data[i].EventType == 'LowWater') {
              tides.push(u + 'L');
            } else if (data[i].EventType == 'HighWater') {
              tides.push(u + 'H');
            };
          };
          if (requested == true) { // send via messaging if the app requested it
            returnTideData(tides);
          } else {
            sendTides(tides);
          }
        }); 
      })
    .catch(function (err) {
      settingsStorage.setItem("error", 1);
      console.log("Error fetching tides: " + err);
    });
  }
}
////////////////// TEST STATION/PORT ID /////////////////////
function testStation(regionID, stationID) {
  // NOAA
  if (regionID == 0) {
    fetch(urlMaker(stationID, 'NOAA'))
    .then(function (response) {
      if (response.status == '200') {
        console.log(200)
          response.json()
          .then(function(data) {
            if (Object.keys(data)[0] == 'error'){ // if returns error, make settings page say so, ask user to try again
              settingsStorage.setItem("error", 1)
            } else {  // if return data, go fetch the new data (and file transfer by not passing a requested value)
              settingsStorage.setItem("error", 0)
              fetchTides(regionID, stationID)
            }
          });
      } else {
        settingsStorage.setItem("error", 1);
        console.log('test failed! try again!')
      }
    })
    .catch(function (err) {
      settingsStorage.setItem("error", 1);
      console.log('test failed! try again!')
    });
    
  // UKHO
  } else if (regionID == 1) {
    var keyHead = new Headers();
    keyHead.append("Ocp-Apim-Subscription-Key", "fb078c29940a460ca4dab1a5172d2c02");
    let initObject = {
      headers: keyHead
    };
    fetch(urlMaker(stationID, 'UKHO'), initObject)
    .then(function (response) {
      if (response.status == '200') {
        console.log(200)
          response.json()
          .then(function(data) {
            if (Object.keys(data)[0] == 'error'){ // if returns error, make settings page say so, ask user to try again
              settingsStorage.setItem("error", 1)
            } else {  // if return data, go fetch the new data (and file transfer by not passing a requested value)
              settingsStorage.setItem("error", 0)
              fetchTides(regionID, stationID)
            }
          });
      } else {
        settingsStorage.setItem("error", 1);
        console.log('test failed! try again!')
      }
    })
    .catch(function (err) {
      settingsStorage.setItem("error", 1);
      console.log('test failed! try again!')
    });
  }
}


//////////////////// FILE TRANSFER BIT //////////////
function sendTides(data) {
  var single = JSON.stringify(data);
  let uint = new Uint8Array(single.length);
  for(var i=0,j=single.length;i<j;++i){
    uint[i]=single.charCodeAt(i);
  }
  outbox.enqueue("tides.txt", uint);
}


//////////////////// MESSAGING BIT //////////////////
// Listen for messages from the device, and activate a tide fetch
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data && evt.data.command == "tides") {
    // The device requested tide data
    fetchTides(getIDs()[0],getIDs()[1], true)
  }
}

// Send tide array to the device
function returnTideData(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the device
    messaging.peerSocket.send(data);
  } else {
    console.log("Error: Connection is not open");
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}