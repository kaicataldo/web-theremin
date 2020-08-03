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
  #lastFrequency;
  #lastGainValue;
  #numTimesCouldNotCalculateCoords;

  constructor(videoEl) {
    this.#videoEl = videoEl;
    this.#videoElBoundingBox = this.#videoEl.getBoundingClientRect();
    this.#model = null;
    this.#lastFrequency = null;
    this.#lastGainValue = null;
    this.#numTimesCouldNotCalculateCoords = 0;
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

    return {
      frequency: this.#calculateFrequency(keypoints[this.#RIGHT_WRIST_IDX]),
      gain: this.#calculateGain(keypoints[this.#LEFT_WRIST_IDX]),
    };
  }

  #calculateFrequency({ position, score }) {
    let xCoord =
      this.#videoElBoundingBox.width -
      (this.#videoElBoundingBox.width - position.x) -
      this.#videoElBoundingBox.width / 2;
    xCoord = xCoord < 0 ? 0 : xCoord;
    let xPos =
      score >= this.#MIN_CONFIDENCE_SCORE
        ? xCoord / (this.#videoElBoundingBox.width / 2)
        : null;
    let frequency = null;
    if (xPos !== null) {
      // https://en.wikipedia.org/wiki/Cent_(music)
      // newNote = oldNote * 2 ** (diffInCents / 1200)
      const C3 = 130;
      const ratioOfNotesToPercentage = 36 / 100;
      const centsPerNote = 100;
      const diffInCents =
        xPos * 100 * ratioOfNotesToPercentage * centsPerNote - C3;
      frequency = window.parseInt(C3 * 2 ** (diffInCents / 1200));
    }

    // This is an attempt to stop the audio from cutting out when the model
    // is unable to find the position of the frequency hand with certainty.
    return (this.#lastFrequency = frequency ?? this.#lastFrequency);
  }

  #calculateGain({ position, score }) {
    const gain =
      score >= this.#MIN_CONFIDENCE_SCORE
        ? window.parseFloat(
            (this.#videoElBoundingBox.height - position.y) /
              this.#videoElBoundingBox.height
          )
        : null;

    if (gain === null) {
      this.#numTimesCouldNotCalculateCoords += 1;

      if (this.#numTimesCouldNotCalculateCoords > 3) {
        return null;
      }
    } else {
      this.#numTimesCouldNotCalculateCoords = 0;
    }

    // This is an attempt to stop the audio from cutting out when the model
    // is unable to find the position of the frequency hand with certainty.
    return (this.#lastGainValue = gain ?? this.#lastGainValue);
  }
}
