import View from "./View";
import CoordinateDetector from "./CoordinateDetector";
import AudioEngine from "./AudioEngine";

export default class Controller {
  #DETECTION_INTERVAL = 10;

  #view;
  #coordinateDetector;
  #audioEngine;
  #intervalId;

  constructor(el) {
    this.#view = new View(el);
    this.#coordinateDetector = new CoordinateDetector(this.#view.getVideoEl());
    this.#audioEngine = new AudioEngine();
    this.#intervalId = null;
  }

  async setup() {
    await this.#view.setup();
    await this.#coordinateDetector.setup();
  }

  start() {
    this.#detect();
    this.#audioEngine.start();
    this.#intervalId = window.setInterval(
      () => this.#detect(),
      this.#DETECTION_INTERVAL
    );
  }

  stop() {
    this.#audioEngine.stop();
    window.clearInterval(this.#intervalId);
  }

  async #detect() {
    const { frequency, gain } = await this.#coordinateDetector.detect();
    this.#audioEngine.setFrequencyAndGain(frequency, gain);
  }
}
