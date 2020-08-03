import "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";

export default class CoordinateDetector {
  // https://github.com/tensorflow/tfjs-models/tree/master/posenet#keypoints
  #LEFT_WRIST_IDX = 9;
  #RIGHT_WRIST_IDX = 10;
  #MIN_CONFIDENCE_SCORE = 0.6;

  #videoEl;
  #model;

  constructor(videoEl) {
    this.#videoEl = videoEl;
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
    const { position: leftPosition, score: leftScore } = keypoints[
      this.#LEFT_WRIST_IDX
    ];
    const { position: rightPosition, score: rightScore } = keypoints[
      this.#RIGHT_WRIST_IDX
    ];
    const nullPosition = { x: null, y: null };

    return {
      left:
        leftScore >= this.#MIN_CONFIDENCE_SCORE ? leftPosition : nullPosition,
      right:
        rightScore >= this.#MIN_CONFIDENCE_SCORE ? rightPosition : nullPosition,
    };
  }
}
