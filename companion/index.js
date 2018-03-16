import clock from "clock";
import document from "document";
import {outbox} from "file-transfer";
import {zeroPad} from "../common/utils"
import { settingsStorage } from "settings";
import { me } from "companion";


console.log("Companion Started");

setTimeout(getTides, 2000); // fire up two seconds after starting clock face
setInterval(getTides, 86400000); // update daily

settingsStorage.onchange = function(evt) {
  // Which setting changed
  console.log("new value: " + evt.newValue)
  getTides()
}

if (me.launchReasons.settingsChanged) {
  // Settings were changed while the companion was not running
  getTides()
}

function getTides() {
  // settingsStorage.setItem("myKey", "myValue");
  console.log('new station ID: ' + settingsStorage.getItem("textInput"));
  let temp = settingsStorage.getItem("textInput").split(":");
  let stationID = temp[1].slice(1,-2);
  console.log('station ID for API: ' + stationID);
  // console.log(settingsStorage.myKey)
  var today = new Date();
  let url = "https://tidesandcurrents.noaa.gov/api/datagetter?begin_date=";
  url += (today.getFullYear().toString() + zeroPad((today.getMonth()+1)) + zeroPad(today.getDate()));
  if (stationID.length == 7 && stationID != 9414290) {
    url += '&range=196&station=' + stationID + '&product=predictions&datum=mllw&units=english';
    console.log('NEW STATION WOOOOOOOO')
  } else {
    console.log("kidding, ok no change. Canned station ID")
    url += '&range=196&station=9414290&product=predictions&datum=mllw&units=english';
  }
  url += '&time_zone=lst_ldt&application=web_services&format=json&interval=hilo';
  fetch(url).then(function(response) {
    console.log('fetched');
    return response.json();
  }).then(function(json) {
    var data = json.predictions;
    var single = JSON.stringify(data);
    let uint=new Uint8Array(single.length);
    for(var i=0,j=single.length;i<j;++i){
      uint[i]=single.charCodeAt(i);
    }
    outbox.enqueue("noaaTides.txt", uint);
  });
};