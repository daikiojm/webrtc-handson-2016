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

// Connectボタンが押されたら処理を開始
let connect = () => {
    if (! peerConnection) {
        console.log('make Offer');
        makeOffer();
    }
    else {
        console.warn('peer already exist.');
    }
}

// Offer SDPを生成する
let makeOffer = () => {
    peerConnection = prepareNewConnection();
    peerConnection.onnegotiationneeded = () => {
        peerConnection.createOffer()
            .then((sessionDescription) => {
                console.log('createOffer() succsess in promise');
                return peerConnection.setLocalDescription(sessionDescription);
            }).then(() => {
                console.log('setLocalDescription() succsess in promise');
        }).catch((err) => {
            console.error(err);
        });
    }
}

// Answer SDPを生成する
let makeAnswer = () => {
    console.log('sending Answer. Creating remote session description...' );
    if (! peerConnection) {
        console.error('peerConnection NOT exist!');
        return;
    }
    peerConnection.createAnswer()
        .then((sessionDescription) => {
            console.log('createAnswer() succsess in promise');
            return peerConnection.setLocalDescription(sessionDescription);
        }).then(() => {
            console.log('setLocalDescription() succsess in promise');
    }).catch((err) => {
        console.error(err);
    });
}

// SDPのタイプを判別しセットする
let onSdpText = () => {
    const text = textToReceiveSdp.value;
    if (peerConnection) {
        // Offerした側が相手からのAnswerをセットする場合
        console.log('Received answer text...');
        const answer = new RTCSessionDescription({
            type : 'answer',
            sdp : text,
        });
        setAnswer(answer);
    }
    else {
        // Offerを受けた側が相手からのOfferをセットする場合
        console.log('Received offer text...');
        const offer = new RTCSessionDescription({
            type : 'offer',
            sdp : text,
        });
        setOffer(offer);
    }
    textToReceiveSdp.value ='';
}

// Offer側のSDPをセットした場合の処理
let setOffer = (sessionDescription) => {
    if (peerConnection) {
        console.error('peerConnection alreay exist!');
    }
    peerConnection = prepareNewConnection();
    peerConnection.onnegotiationneeded = () {
        peerConnection.setRemoteDescription(sessionDescription)
            .then(() => {
                console.log('setRemoteDescription(offer) succsess in promise');
                makeAnswer();
            }).catch((err) => {
                console.error('setRemoteDescription(offer) ERROR: ', err);
        });
    }
}

// Answer側のSDPをセットした場合の処理
let setAnswer = (sessionDescription) => {
    if (! peerConnection) {
        console.error('peerConnection NOT exist!');
        return;
    }
    peerConnection.setRemoteDescription(sessionDescription)
        .then(() => {
            console.log('setRemoteDescription(answer) succsess in promise');
        }).catch(function(err) {
            console.error('setRemoteDescription(answer) ERROR: ', err);
    });
}
