
window.onload = () => {
  const warningEl = document.getElementById('warning');
  const videoElement = document.getElementById('videoElement');
  const captureBtn = document.getElementById('captureBtn');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const download = document.getElementById('download');
  const audioToggle = document.getElementById('audioToggle');
  const micAudioToggle = document.getElementById('micAudioToggle');
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({
    log: true,
    corePath: '/ffmpeg-core.js',
  });

  if ('getDisplayMedia' in navigator.mediaDevices) warningEl.style.display = 'none';

  let blobs;
  let blob;
  let rec;
  let stream;
  let voiceStream;
  let desktopStream;

  const transcode = async (file) => {
    const name = 'video';
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    ffmpeg.setLogging(true);

    ffmpeg.FS('writeFile', name, await fetchFile(file));

    await ffmpeg.run('-i', name, 'output.mp4');
    const data = ffmpeg.FS('readFile', 'output.mp4');

    // let filename = window.prompt('Enter file name'),
    // downloadLink = document.createElement('a');
    // downloadLink.href = URL.createObjectURL(blob);
    // downloadLink.download = `${filename}.webm`;

    // let filename = window.prompt('Enter file name'); 
    let downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

    downloadLink.download = `Recording.mp4`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    URL.revokeObjectURL(blob); // clear from memory
    document.body.removeChild(downloadLink);


  }

  const mergeAudioStreams = (desktopStream, voiceStream) => {
    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    let hasDesktop = false;
    let hasVoice = false;
    if (desktopStream && desktopStream.getAudioTracks().length > 0) {
      // If you don't want to share Audio from the desktop it should still work with just the voice.
      const source1 = context.createMediaStreamSource(desktopStream);
      const desktopGain = context.createGain();
      desktopGain.gain.value = 0.7;
      source1.connect(desktopGain).connect(destination);
      hasDesktop = true;
    }

    if (voiceStream && voiceStream.getAudioTracks().length > 0) {
      const source2 = context.createMediaStreamSource(voiceStream);
      const voiceGain = context.createGain();
      voiceGain.gain.value = 0.7;
      source2.connect(voiceGain).connect(destination);
      hasVoice = true;
    }

    return (hasDesktop || hasVoice) ? destination.stream.getAudioTracks() : [];
  };

  captureBtn.onclick = async () => {
    download.style.display = 'none';
    const audio = audioToggle.checked || false;
    const mic = micAudioToggle.checked || false;

    desktopStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: audio });

    if (mic === true) {
      voiceStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: mic });
    }

    const tracks = [
      ...desktopStream.getVideoTracks(),
      ...mergeAudioStreams(desktopStream, voiceStream)
    ];

    console.log('Tracks to add to stream', tracks);
    stream = new MediaStream(tracks);
    console.log('Stream', stream)
    videoElement.srcObject = stream;
    videoElement.muted = true;

    blobs = [];

    rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
    rec.ondataavailable = (e) => blobs.push(e.data);
    rec.onstop = async () => {

      //blobs.push(MediaRecorder.requestData());
      blob = new Blob(blobs, { type: 'video/webm; codecs=vp9' });

      transcode(URL.createObjectURL(blob));

      // let url = window.URL.createObjectURL(blob);
      // download.href = url;
      // download.download = 'test.webm';
      // download.style.display = 'block';
    };
    startBtn.disabled = false;
    captureBtn.disabled = true;
    audioToggle.disabled = true;
    micAudioToggle.disabled = true;
    // };

    // startBtn.onclick = () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    rec.start();
  };

  stopBtn.onclick = () => {
    rec.stop();
    captureBtn.disabled = false;
    audioToggle.disabled = false;
    micAudioToggle.disabled = false;
    startBtn.disabled = true;
    stopBtn.disabled = true;
    document.write("<center><img src='./images/warning1.png'></center>")
    document.write("<center><h1>Warning: Dont close or Refresh tab until the file gets downloaded</h1></center>");
    document.write("<center><h3>Your recording getting optimized please wait &#128512;&#128512;........</h3></center>")
    document.write("<center>Note: You can open the same link in diffrent tab and start recording while this video getting downloaded or Once download has been completed you can refresh the page to record more</center>")

    stream.getTracks().forEach(s => s.stop())
    videoElement.srcObject = null
    stream = null;
    // console.log("closing desktop and voice stream")
    // desktopStream.stop();
    // voiceStream.stop();

  };
};
