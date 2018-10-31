let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let video = document.getElementById('source-video');

// LCDのドットマトリクス
dotData = new Array(10240);

let thretholdDOM = document.getElementById("threthold");
let transmitIntervalTime = 12;
// Interlace 時は 12ms 以下だとキツい

// let transmitSequence = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // Progressive
let transmitSequence = [0, 2, 4, 6, 8, 10, 12, 14, 15, 1, 3, 5, 7, 9, 11, 13, 15]; // Interlace

let transmitSequencePosition = 0;

function init() {
  setInterval(() => {
    context.drawImage(video, 23, 0, 113, 64);
    draw();
  }, transmitIntervalTime);
}

function draw() {
  let threthold = thretholdDOM.value;
  let imageData = context.getImageData(0, 0, 160, 64);

  for (let i = 0; i < 64; i++) {
    for(let k = 0; k < 160; k++) {
      let red   = imageData.data[(i * 160 + k) * 4];
      let green = imageData.data[(i * 160 + k) * 4 + 1];
      let blue  = imageData.data[(i * 160 + k) * 4 + 2];
      let luminance = 0.299 * red + 0.587 * green + 0.114 * blue

      if(luminance < threthold) dotData[i * 160 + k] = 1;
      else dotData[i * 160 + k] = 0;
    }
  }

  let sectionNumber = transmitSequence[transmitSequencePosition];
  let sysExDataBytes = [];

  for (let i = sectionNumber * 4; i < sectionNumber * 4 + 4; i++) {
    for(let j = 0; j < 160; j+=6) {
      sysExDataBytes.push(
        dotData[i*160+j] << 5 |
        dotData[i*160+j+1] << 4 |
        dotData[i*160+j+2] << 3 |
        dotData[i*160+j+3] << 2 |
        dotData[i*160+j+4] << 1 |
        dotData[i*160+j+5]
      );
    }
  }

  // Calculate checksum
  let checksum = 0x20 + sectionNumber + 0x00;
  for (let i = 0; i < sysExDataBytes.length; i++) {
    checksum += sysExDataBytes[i];
  }

  checksum = (128 - (checksum % 128)) % 128;

  let sysEx = [0xf0, 0x41, 0x10, 0x45, 0x12, 0x20, sectionNumber, 0x00].concat(sysExDataBytes).concat([checksum, 0xf7]);

  transmitSysEx(sysEx);

  // デバッグ用
  // console.log(byteArrayToHexString(sysEx));

  transmitSequencePosition++;
  transmitSequencePosition %= transmitSequence.length;
}

function byteArrayToHexString(source) {
  let string = '';
  for (var i = 0; i < source.length; i++) {
    string += ('0' + source[i].toString(16).toUpperCase()).substr(-2) + ' ';
  }
  return string;
}