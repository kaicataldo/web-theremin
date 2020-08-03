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
    this.#videoElBoundingBox = null;
    this.#model = null;
    this.#lastFrequency = null;
    this.#lastGainValue = null;
    this.#numTimesCouldNotCalculateCoords = 0;
  }

  async setup() {
    // Delay this until setup to ensure that the video element has
    // height and width attributes applied.
    this.#videoElBoundingBox = this.#videoEl.getBoundingClientRect();

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

  #calculateFrequencyfromPosition(pos) {
    // https://en.wikipedia.org/wiki/Cent_(music)
    // newNote = oldNote * 2 ** (diffInCents / 1200)
    const C3 = 130;
    const ratioOfNotesToPercentage = 36 / 100;
    const centsPerNote = 100;
    const diffInCents =
      (pos / (this.#videoElBoundingBox.width / 2)) *
        100 *
        ratioOfNotesToPercentage *
        centsPerNote -
      C3;
    return C3 * 2 ** (diffInCents / 1200);
  }

  #calculateFrequency({ position, score }) {
    let frequency = null;

    if (typeof position.x === "number") {
      // Distance from the leftmost edge of the pitch
      // field (the right half of the video element).
      let xPos =
        this.#videoElBoundingBox.width -
        (this.#videoElBoundingBox.width - position.x) -
        this.#videoElBoundingBox.width / 2;

      if (xPos < 0) {
        xPos = 0;
      }

      if (score >= this.#MIN_CONFIDENCE_SCORE) {
        frequency = this.#calculateFrequencyfromPosition(xPos);
      }
    }

    // This is an attempt to stop the audio from cutting out when the model
    // is unable to find the position of the frequency hand with certainty.
    return (this.#lastFrequency = frequency ?? this.#lastFrequency);
  }

  #calculateGain({ position, score }) {
    let gain = null;

    if (typeof position.y === "number") {
      const yCoord = this.#videoElBoundingBox.height - position.y;

      if (score >= this.#MIN_CONFIDENCE_SCORE) {
        gain = Number(
          Number.parseFloat(
            yCoord / (this.#videoElBoundingBox.height * (1 / 3))
          ).toFixed(2)
        );
      }

      if (gain > 1) {
        gain = 1;
      }
    }

    // Treat no visible hand as 0.
    if (gain === null) {
      this.#numTimesCouldNotCalculateCoords += 1;

      if (this.#numTimesCouldNotCalculateCoords > 4) {
        return 0;
      }
    } else {
      this.#numTimesCouldNotCalculateCoords = 0;
    }

    // This is an attempt to stop the audio from cutting out when the model
    // is unable to find the position of the frequency hand with certainty.
    return (this.#lastGainValue = gain ?? this.#lastGainValue);
  }
}
