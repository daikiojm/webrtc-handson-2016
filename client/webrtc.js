'use strict';
const localVideo = document.getElementById('local_video');
const remoteVideo = document.getElementById('remote_video');
const textForSendSdp = document.getElementById('text_for_send_sdp');
const textToReceiveSdp = document.getElementById('text_for_receive_sdp');
let localStream = null;
let peerConnection = null;

// getUserMediaでカメラ、マイクにアクセス
let startVideo = () => {
    navigator.mediaDevices.getUserMedia({video: { frameRate: { min: 10, max: 15 } }, audio: true})
        .then((stream) => { // success
            playVideo(localVideo,stream);
            localStream = stream;
        }).catch((error) => { // error
        console.error('mediaDevice.getUserMedia() error:', error);
        return;
    });
}
// Videoの再生を開始する
let playVideo = (element, stream) => {
    element.srcObject = stream;
    element.play();
}

// WebRTCを利用する準備をする
let prepareNewConnection = () => {
    // RTCPeerConnectionを初期化する
    // ここではskywayのstunサーバーを指定している
    const pc_config = {"iceServers":[ {"urls":"stun:stun.skyway.io:3478"} ]};
    const peer = new RTCPeerConnection(pc_config);

    // リモートのストリームを受信した場合のイベントをセット
    if ('ontrack' in peer) {
        peer.ontrack = function(event) {
            console.log('-- peer.ontrack()');
            playVideo(remoteVideo, event.streams[0]);
        };
    }
    else {
        peer.onaddstream = function(event) {
            console.log('-- peer.onaddstream()');
            playVideo(remoteVideo, event.stream);
        };
    }

    // ICE Candidateを収集したときのイベント
    peer.onicecandidate = function (evt) {
        if (evt.candidate) {
            console.log(evt.candidate);
        } else {
            console.log('empty ice event');
            sendSdp(peer.localDescription);
        }
    };

    // ローカルのストリームを利用できるように準備する
    if (localStream) {
        console.log('Adding local stream...');
        peer.addStream(localStream);
    }
    else {
        console.warn('no local stream, but continue.');
    }

    return peer;
}

// 手動シグナリングのための処理を追加する
let sendSdp => (sessionDescription) {
    console.log('---sending sdp ---');
    textForSendSdp.value = sessionDescription.sdp;
    textForSendSdp.focus();
    textForSendSdp.select();
}
