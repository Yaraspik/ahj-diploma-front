export default class Media {
  constructor() {
    this.chunks = [];
    this.modal = document.querySelector('.video-modal');
    this.videoPlayerOnline = document.querySelector('.video-player-online');
  }

  async init() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this.recorder = new MediaRecorder(this.stream);
      return true;
    } catch (error) {
      return false;
    }
  }

  start() {
    this.recorder.addEventListener('start', () => {
      console.log('start');
    });

    this.recorder.addEventListener('dataavailable', (event) => {
      this.chunks.push(event.data);
    });

    this.recorder.addEventListener('stop', () => {
      this.blob = new Blob(this.chunks, {
        type: 'video/webm',
      });

      this.res = URL.createObjectURL(this.blob);
    });

    this.recorder.start();
    this.modal.open = true;
    this.videoPlayerOnline.srcObject = this.stream;

    this.videoPlayerOnline.addEventListener('canplay', () => {
      this.videoPlayerOnline.play();
    });
  }

  stop() {
    this.recorder.stop();
    this.stream.getTracks().forEach((track) => track.stop());
  }
}
