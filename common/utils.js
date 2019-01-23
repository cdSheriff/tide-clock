import clock from "clock";
import document from "document";

// add zero in front of numbers. Needed for minutes and for API
export function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}