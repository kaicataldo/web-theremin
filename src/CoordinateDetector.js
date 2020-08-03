import "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";

export default class CoordinateDetector {
  // https://github.com/tensorflow/tfjs-models/tree/master/posenet#keypoints
  #LEFT_WRIST_IDX = 9;
  #RIGHT_WRIST_IDX = 10;
  #MIN_CONFIDENCE_SCORE = 0.6;

  #videoEl;
  #videoElBoundingBox;
  #model;

  constructor(videoEl) {
    this.#videoEl = videoEl;
    this.#videoElBoundingBox = this.#videoEl.getBoundingClientRect();
    this.#model = null;
  }

  async setup() {
    try {
      this.#model = await posenet.load();
    } catch (e) {
      console.log(e);
      throw new Error("Could not load model.");
    }
  }

  async detect() {
    const { keypoints } = await this.#model.estimateSinglePose(this.#videoEl, {
      flipHorizontal: true,
    });
    // These are switched since the image is flipped.
    const { position: rightPosition, score: rightScore } = keypoints[
      this.#LEFT_WRIST_IDX
    ];
    const { position: leftPosition, score: leftScore } = keypoints[
      this.#RIGHT_WRIST_IDX
    ];

    return {
      frequency:
        leftScore >= this.#MIN_CONFIDENCE_SCORE
          ? this.#calculateFrequency(leftPosition)
          : null,
      gain:
        rightScore >= this.#MIN_CONFIDENCE_SCORE
          ? this.#calculateGain(rightPosition)
          : null,
    };
  }

  #calculateFrequency({ x }) {
    return window.parseInt(this.#videoElBoundingBox.width - x);
  }

  #calculateGain({ y }) {
    return (
      (this.#videoElBoundingBox.height - y) / this.#videoElBoundingBox.height
    );
  }
}
