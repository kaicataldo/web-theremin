export default class View {
  #rootEl;
  #videoEl;

  constructor(el) {
    this.#rootEl = el;
    this.#videoEl = this.#createVideoEl();
  }

  async setup() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
        },
      });
      window.localStream = stream;
      this.#videoEl.srcObject = stream;
    } catch {
      throw new Error("Please enable video.");
    }

    // Wait until video loads before running pose prediction.
    return new Promise((resolve) => {
      this.#videoEl.onloadeddata = () => {
        this.#videoEl.play();

        // Wait until we the video is rendered before calcuating bounding box.
        // https://github.com/tensorflow/tfjs/issues/322
        const { height, width } = this.#videoEl.getBoundingClientRect();
        this.#videoEl.height = height;
        this.#videoEl.width = width;

        console.log("Video started!");
        resolve();
      };
    });
  }

  getVideoEl() {
    return this.#videoEl;
  }

  #createVideoEl() {
    const videoEl = document.createElement("video");
    videoEl.classList.add("video-stream");
    videoEl.muted = true;
    this.#rootEl.appendChild(videoEl);
    return videoEl;
  }
}
