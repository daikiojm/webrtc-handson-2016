'use strict';
const localVideo = document.getElementById('local_video');
const remoteVideo = document.getElementById('remote_video');
const textForSendSdp = document.getElementById('text_for_send_sdp');
const textToReceiveSdp = document.getElementById('text_for_receive_sdp');
let localStream = null;
let peerConnection = null;

// getUserMediaでカメラ、マイクにアクセス
function startVideo() {
    navigator.mediaDevices.getUserMedia({video: { frameRate: { min: 10, max: 15 } }, audio: true})
        .then(function (stream) { // success
            playVideo(localVideo,stream);
            localStream = stream;
        }).catch(function (error) { // error
        console.error('mediaDevice.getUserMedia() error:', error);
        return;
    });
}
// Videoの再生を開始する
let playVideo = (element, stream) => {
    element.srcObject = stream;
    element.play();
}
