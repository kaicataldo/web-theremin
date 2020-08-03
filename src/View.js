export default class View {
  #rootEl;
  #videoEl;

  constructor(el) {
    this.#rootEl = el;
    this.#videoEl = this.#createVideoEl();
  }

  async setup() {
    // https://github.com/tensorflow/tfjs/issues/322
    // Video must have height and width in order to be used as input.
    this.#videoEl.width = 640;
    // Aspect ratio of 3/4 is used to support Safari browser.
    this.#videoEl.height = this.#videoEl.width * (3 / 4);

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
