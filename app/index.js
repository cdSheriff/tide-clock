import clock from "clock";
import document from "document";
import { inbox } from "file-transfer";
import fs from "fs";
import {zeroPad} from "../common/utils";
import {countdown} from "../common/utils";
import {hourMe} from "../common/utils";
import { me as device } from "device";

let countdownText = document.getElementById('countdown');
let myLabel = document.getElementById("myLabel");
let dayed = document.getElementById("dayed");
// let dated = document.getElementById("dated");
var fishTime = document.getElementById("fishTime");
var tideLine = document.getElementById("tideLine");
var highTide = document.getElementById("highTide");
var lowTide = document.getElementById("lowTide");
let side = document.getElementById('side');

// adjust fishie position for meson
if (device.modelName == 'Versa') {fishTime.x = -24}

// Update the clock every minute
clock.granularity = "minutes";

// Get a handle on the <text> element
let globalTides;

// Update the <text> element with the current time
function updateClock(globalTides) {
  
  // the clock section here
  console.log('updating clock');
  let today = new Date();
  let date = zeroPad(today.getDate());
  let hours = today.getHours() % 12 || 12;
  // let houring = hourMe(today.getHours());
  side.text = `${hourMe(today.getHours())}`;
  // hours = houring[1];
  let mins = zeroPad(today.getMinutes());
  let days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let day = days[today.getDay()];
  myLabel.text = `${hours}:${mins}`;
  dayed.text = `${day} ${date}`;
  // dated.text = `${date}`;
  
  // if the global tide variabe is there, use it
  if (globalTides) {
    var goodies = countdown(globalTides, today);
  } else {
    // or else, go find it/make it
    console.log('elsing!')
    try {
      let ascii_read = fs.readFileSync("sevenDay.txt", "utf-8");
      // console.log("ASCII Data: ");
      if (ascii_read) {
        console.log('ok local file to global tides');
        globalTides = ascii_read;
      } else {
        console.log('nothing was read, didnt make it global');
      };
     var goodies = countdown(globalTides, today);
    }
    catch (e) {
      console.log('there was nothing in the file system! ugh')
    }
  };
  // just in case goodies hasnt been made yet
  if (typeof goodies !== "undefined") {
  if (goodies[0] <= 90) {
      fishTime.style.visibility = "visible";
    } else {
      fishTime.style.visibility = "hidden";
    };
    let h = (Math.floor(goodies[0]/60)).toString();
    let m = zeroPad(goodies[0] - (h * 60)).toString();
    let timeLeft = h + ':' + m;
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



// Update the clock every tick event
clock.ontick = () => updateClock(globalTides);

//////////////////////////////////////////////////

console.log("App Started");


let quips = ['Tying knots...','Baiting hooks...','Pinching barbs...','Patching waders...','Winding spools...','Telling tales...'];
var rng = Math.floor(Math.random() * 6);
countdownText.text = quips[rng];

// Event occurs when new file(s) are received
inbox.onnewfile = () => {
  console.log("New file!");
  let fileName;
  do {
    // If there is a file, move it from staging into the application folder
    fileName = inbox.nextFile();
    if (fileName) {
      let data = fs.readFileSync(fileName, "utf-8");
      globalTides = data;
      fs.writeFileSync("sevenDay.txt", data, "utf-8");
    }
  } while (fileName);
};

