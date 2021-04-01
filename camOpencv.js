const video = document.querySelector('#webcam');
const video2 = document.querySelector('#webcam2');
const enableWebcamButton = document.querySelector('#enableWebcamButton');
const enableWebcamButton2 = document.querySelector('#enableWebcamButton2');
const disableWebcamButton = document.querySelector('#disableWebcamButton');
const disableWebcamButton2 = document.querySelector('#disableWebcamButton2');
const thresholdButton = document.querySelector('#thresholdButton');
const canvas = document.querySelector('#outputCanvas');
const canvas2 = document.querySelector('#outputCanvas2');

var th1 = undefined;
var th2 = undefined;

function onOpenCvReady() {
  document.querySelector('#status').innerHTML = 'opencv.js is ready.';
  /* enable the button */
  enableWebcamButton.disabled = false;
  enableWebcamButton2.disabled = false;
}

/* Check if webcam access is supported. */
function getUserMediaSupported() {
  /* Check if both methods exists.*/
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
    
    /* alternative approach 
    return ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices);
    */
}

  /* 
   * If webcam is supported, add event listener to button for when user
   * wants to activate it to call enableCam function which we will 
   * define in the next step.
   */

if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
  enableWebcamButton2.addEventListener('click', enableCam2);
  disableWebcamButton.addEventListener('click', disableCam);
  disableWebcamButton2.addEventListener('click', disableCam2);
  thresholdButton.addEventListener('click', updateThreshold);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

function updateThreshold() {
  th1=document.getElementById("threshold1").value;
  th2=document.getElementById("threshold2").value;
  if ( !isNaN(th1) && !isNaN(th2) ){
    th1 = parseInt(th1);
    th2 = parseInt(th2);
  }
  else {
    alert('請輸入數字！');
    th1 = 0;
    th2 = 0;
  }
};

function enableCam(event) {
  updateThreshold();

  /* disable this button once clicked.*/
  event.target.disabled = true;
    
  /* show the disable webcam button once clicked.*/
  disableWebcamButton.disabled = false;
  thresholdButton.disabled = false;

  /* show the video and canvas elements */
  document.querySelector("#liveView").style.display = "block";
  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.srcObject = stream;
    video.addEventListener('loadeddata', processVid);
  })
  .catch(function(err){
    console.error('Error accessing media devices.', error);
  });
};

function enableCam2(event) {
  event.target.disabled = true;
  disableWebcamButton2.disabled = false;
  document.querySelector("#liveView2").style.display = "block";
  const constraints = {
    video: true
  };
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video2.srcObject = stream;
    video2.addEventListener('loadeddata', processVid2);
  })
  .catch(function(err){
    console.error('Error accessing media devices.', error);
  });
};

function disableCam(event) {
    event.target.disabled = true;
    thresholdButton.disabled = true;
    enableWebcamButton.disabled = false;
    
    /* stop streaming */
    video.srcObject.getTracks().forEach(track => {
      track.stop();
    })
  
    /* clean up. some of these statements should be placed in processVid() */
    video.srcObject = null;
    video.removeEventListener('loadeddata', processVid);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    document.querySelector("#liveView").style.display = "none";
}

function disableCam2(event) {
    event.target.disabled = true;
    enableWebcamButton2.disabled = false;
    video2.srcObject.getTracks().forEach(track => {
      track.stop();
    })
    video2.srcObject = null;
    video2.removeEventListener('loadeddata', processVid2);
    const context = canvas2.getContext('2d');
    context.clearRect(0, 0, canvas2.width, canvas2.height);
    document.querySelector("#liveView2").style.display = "none";
}

function processVid() {

  if (video.srcObject == null) {
    return;
  }

  let cap = new cv.VideoCapture(video);
  /* 8UC4 means 8-bit unsigned int, 4 channels */
  let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  cap.read(frame);
  processFrame(frame);
}

function processVid2() {
  if (video2.srcObject == null) {
    return;
  }
  let cap = new cv.VideoCapture(video2);
  let frame = new cv.Mat(video2.height, video2.width, cv.CV_8UC4);
  cap.read(frame);
  processFrame2(frame);
}

function processFrame(src) {
  let dst = new cv.Mat();
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
  cv.Canny(dst, dst, th1, th2);
  cv.imshow('outputCanvas', dst);
  src.delete();
  dst.delete();

  /* Call this function again to keep processing when the browser is ready. */
  window.requestAnimationFrame(processVid);
}

function processFrame2(src) {
  let dst = new cv.Mat();
  let dst_gray = new cv.Mat();
  let dst_thr = new cv.Mat();
  let dst_ivt = new cv.Mat();
  let dst_blur = new cv.Mat();
  cv.cvtColor(src, dst_gray, cv.COLOR_RGBA2GRAY);
  cv.bitwise_not(dst_gray, dst_ivt);
  let ksize = new cv.Size(21, 21);
  cv.GaussianBlur(dst_ivt, dst_blur, ksize, 0, 0, cv.BORDER_DEFAULT);
  cv.bitwise_not(dst_blur, dst_blur);
  cv.divide(dst_gray, dst_blur, dst, 256, -1);
  cv.imshow('outputCanvas2', dst);
  src.delete();
  dst.delete();
  dst_gray.delete();dst_thr.delete();dst_ivt.delete();dst_blur.delete();

  /* Call this function again to keep processing when the browser is ready. */
  window.requestAnimationFrame(processVid2);
}