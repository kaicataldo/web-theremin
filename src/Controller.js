import View from "./View";
import CoordinateDetector from "./CoordinateDetector";

export default class Controller {
  #DETECTION_INTERVAL = 20;

  #view;
  #detector;
  #intervalId;

  constructor(el) {
    this.#view = new View(el);
    this.#detector = new CoordinateDetector(this.#view.getVideoEl());
    this.#intervalId = null;
  }

  async setup() {
    return Promise.all([this.#view.setup(), this.#detector.setup()]);
  }

  start() {
    this.#intervalId = setInterval(
      () => this.#detect(),
      this.#DETECTION_INTERVAL
    );
  }

  stop() {
    clearInterval(this.#intervalId);
  }

  #detect() {
    const coords = this.#detector.detect();
  }
}
