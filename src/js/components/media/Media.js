export default class Media {
  constructor() {
    this.chunks = [];
    this.modal = document.querySelector('.video-modal');
    this.videoPlayerOnline = document.querySelector('.video-player-online');
  }

  async init(permissions, type) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(permissions);
      this.recorder = new MediaRecorder(this.stream);
      this.type = type;
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
      const type = this.type === 'video' ? `${this.type}/webm` : `${this.type}/mp3`;
      this.blob = new Blob(this.chunks, {
        type,
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
    this.chunks = [];
  }
}
