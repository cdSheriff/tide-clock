import clock from "clock";
import document from "document";

// add zero in front of numbers. Needed for minutes and for API
export function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

// calculate time until the next tide, and export the tide style
export function countdown(globalTides, today) {
  let tideChart = JSON.parse(globalTides);
  for (var i = 0; i < tideChart.length; i ++) {
    let offset = today.getTimezoneOffset()
    let tempTime = tideChart[i]['t'].toString();
    let localMinute = Math.floor(today.getTime()/60000);
    let tideMinute = Math.floor((Date.parse(tempTime.split(' ').join('T'))+(60*offset*1000))/60000);
    if (localMinute < tideMinute) {
      let goodies = [tideMinute - localMinute, tideChart[i]['type']];
      i = tideChart.length;
    };
  };
  return goodies;
};

// export function hourMe(hours) {
//   let houring = [];
//   if (hours >= 12 && hours < 23) {
//     houring[0] = 'PM';
//   } else {
//     houring[0] = 'AM';
//   };
//   if (hours > 12) {
//     hours -= 12;
//   };
//   if (hours == 0) {
//     hours = 12;
//   };
//   houring[1] = hours;
//   return houring;
// };

export function hourMe(hours) {
  let houring = ['AM',hours];
  if (houring[1] == 0) {
    houring[1] = 12;
  } else if (houring == 12) {
    houring[0] = 'PM';
  } else if (houring[1] >= 13) {
    houring = ['PM', houring[1] - 12];
  };
  return houring;
};