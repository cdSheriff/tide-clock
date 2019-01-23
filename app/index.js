////////////////////// SETUP ////////////////////
// import all the crap I need
import * as messaging from "messaging";
import clock from "clock";
import document from "document";
import { inbox } from "file-transfer";
import * as fs from "fs";
import { me as device } from "device";

// text (time, day/date, am/pm, countdown)
let countdownText = document.getElementById('countdown');
let myLabel = document.getElementById("myLabel");
let dayed = document.getElementById("dayed");
let side = document.getElementById('side');

// graphics (line, arc fills, fishies)
var fishTime = document.getElementById("fishTime");
var tideLine = document.getElementById("tideLine");
var highTide = document.getElementById("highTide");
var lowTide = document.getElementById("lowTide");

// adjust fishie position for meson
if (device.modelName == 'Versa') {fishTime.x = -24}

// make a global variable for tide predictions (EW)
let globalTides;

////////////////// CLOCKY BITs /////////////////////////////
// Update the clock every minute
clock.granularity = "minutes";

// function for the clocky bit
function updateClock(today) {
  // AM/PM
  side.text = today.getHours() >= 12 ? 'PM' : 'AM';
  // hours and minutes
  myLabel.text = `${today.getHours() % 12 || 12}:${zeroPad(today.getMinutes())}`;
  // day of the week and date
  dayed.text = `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][today.getDay()]} ${zeroPad(today.getDate())}`;
};

function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}


////////////////// GRAPHIC BITS ///////////////////////
// handles the graphic elements
function updateGraphics(goodies, today) {
  if (typeof goodies !== "undefined") {
    if (goodies[0] <= 90) {
        fishTime.style.visibility = "visible";
    } else {
        fishTime.style.visibility = "hidden";
    };

    // timeleft is minutes/60 (so hours) : minutes minus the hours
    let timeLeft = Math.floor(goodies[0]/60) + ':' + zeroPad(goodies[0] - (Math.floor(goodies[0]/60) * 60));
    if (goodies[1] == 'H') {
      highTide.style.visibility = 'visible';
      lowTide.style.visibility = 'hidden';
      countdownText.text = `${timeLeft} to high tide`

    };
    if (goodies[1] == 'L') {
      lowTide.style.visibility = 'visible';
      highTide.style.visibility = 'hidden';
      countdownText.text = `${timeLeft} to low tide`
    };
  } else {
    console.log('no goodies yet!');
  };
};

// master screen control bit
function updateScreen(globalTides) {
  var today = new Date()
  updateClock(today)
  try {
    updateGraphics(countdown(JSON.parse(fs.readFileSync("tides.txt", "utf-8")), today), today)
  }
  catch (e) {
    fetchTides()
  }
};

function countdown(tideChart, today) {
  // console.log('here is what was passed to util: ' + tideChart)
  for (var i = 0; i < tideChart.length; i ++) {
    let offset = today.getTimezoneOffset()
    let localMinute = Math.floor(today.getTime()/60000);
    let tideMinute = Math.floor((Date.parse(tideChart[i].slice(0, -1))+(60*offset*1000))/60000);
    if (localMinute < tideMinute) {
      let goodies = [tideMinute - localMinute, tideChart[i].substr(-1)];
      break
    };
  };
  console.log(goodies)
  return goodies;
};

// Update the clock every tick event
clock.ontick = () => updateScreen(globalTides);
// Ask for new data every 24 hours
setInterval(fetchTides, 24*60*60*1000)

//////////////////////////////////////////////////

console.log("App Started");


let quips = ['Tying knots...','Baiting hooks...','Pinching barbs...','Patching waders...','Winding spools...','Telling tales...'];
var rng = Math.floor(Math.random() * 6);
countdownText.text = quips[rng];

// Event occurs when new file(s) are received
inbox.onnewfile = () => {
  console.log("New file!");
  // sniffFiles()
  let fileName;
  do {
    // If there is a file, move it from staging into the application folder
    fileName = inbox.nextFile();
    if (fileName == 'tides.txt') {
      let data = fs.readFileSync(fileName, "utf-8");
      fs.writeFileSync(fileName, data, "utf-8");
    }
  } while (fileName);
  // sniffFiles()
  // parseFiles()
};


////////////////// MESSAGING BIT (ASK FOR TIDES) ////////////////
// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  // Fetch weather when the connection opens
  fetchTides();
}

// gimme my tides!
function fetchTides() {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the companion
    messaging.peerSocket.send({
      command: 'tides'
    });
  }
}

// Listen for messages from the companion
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data) {
    var today = new Date()
    fs.writeFileSync("msgTides.txt", JSON.stringify(evt.data), "utf-8");
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}

// do something with them
function processTideData(data) {
  console.log("The tide array is: " + data);
  fs.writeFileSync("tides.txt", JSON.stringify(data), "utf-8");
}

