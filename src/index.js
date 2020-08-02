import "regenerator-runtime/runtime";
import "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";
import "./styles.css";

const DETECTION_INTERVAL = 20;
// https://github.com/tensorflow/tfjs-models/tree/master/posenet#keypoints
const LEFT_WRIST_IDX = 9;
const RIGHT_WRIST_IDX = 10;
const MIN_CONFIDENCE_SCORE = 0.6;

class VideoInterface {
  constructor(el) {
    this._videoEl = el;
    this._model = null;
    this._callbacks = [];
  }

  async setup() {
    await Promise.all([this._loadModel(), this._setupVideo()]);
  }

  register(callback) {
    this._callbacks.push(callback);
  }

  start() {
    setInterval(() => this._detect(), DETECTION_INTERVAL);
  }

  async _loadModel() {
    try {
      this._model = await posenet.load();
    } catch (e) {
      console.log(e);
      throw new Error("Could not load model.");
    }
  }

  async _setupVideo() {
    // https://github.com/tensorflow/tfjs/issues/322
    // Video must have height and width in order to be used as input.
    this._videoEl.width = 640;
    // Aspect ratio of 3/4 is used to support Safari browser.
    this._videoEl.height = this._videoEl.width * (3 / 4);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
        },
      });
      window.localStream = stream;
      this._videoEl.srcObject = stream;
    } catch {
      throw new Error("Please enable video.");
    }

    // Wait until video loads before running pose prediction.
    return new Promise((resolve) => {
      this._videoEl.onloadeddata = () => {
        this._videoEl.play();
        console.log("Video started!");
        resolve();
      };
    });
  }

  async _detect() {
    const pose = await this._model.estimateSinglePose(this._videoEl, {
      flipHorizontal: true,
    });
    for (const callback of this._callbacks) {
      callback(pose);
    }
  }
}

(async () => {
  const videoEl = document.querySelector(".video-stream");
  const videoInterface = new VideoInterface(videoEl);
  try {
    await videoInterface.setup();
  } catch (e) {
    console.error(e);
  }

  videoInterface.register(({ keypoints }) => {
    const {
      position: { x: leftX, y: leftY },
      score: leftScore,
    } = keypoints[LEFT_WRIST_IDX];
    const {
      position: { x: rightX, y: rightY },
      score: rightScore,
    } = keypoints[RIGHT_WRIST_IDX];

    if (leftScore >= MIN_CONFIDENCE_SCORE) {
      document.querySelector(".l-position-x").textContent = leftX;
      document.querySelector(".l-position-y").textContent = leftY;
    } else {
      document.querySelector(".l-position-x").textContent = "No left wrist!";
      document.querySelector(".l-position-y").textContent = "No left wrist!";
    }
    if (rightScore >= MIN_CONFIDENCE_SCORE) {
      document.querySelector(".r-position-x").textContent = rightX;
      document.querySelector(".r-position-y").textContent = rightY;
    } else {
      document.querySelector(".r-position-x").textContent = "No right wrist!";
      document.querySelector(".r-position-y").textContent = "No right wrist!";
    }
  });

  videoInterface.start();
})();
