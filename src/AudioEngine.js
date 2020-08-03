export default class AudioEngine {
  #audioCtx;
  #oscillatorNode;
  #gainNode;

  constructor() {
    this.#audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const { oscillatorNode, gainNode } = this.#createAudioNodes();
    this.#oscillatorNode = oscillatorNode;
    this.#gainNode = gainNode;
  }

  start() {
    this.#oscillatorNode.start();
  }

  stop() {
    this.#oscillatorNode.stop();
  }

  // These values are null when no value is given.
  setFrequencyAndGain(frequency, gain) {
    if (typeof frequency === "number") {
      this.#oscillatorNode.frequency.setValueAtTime(
        frequency,
        this.#audioCtx.currentTime
      );
    }

    this.#gainNode.gain.setValueAtTime(
      typeof gain === "number" ? gain : 0,
      this.#audioCtx.currentTime
    );
  }

  #createAudioNodes() {
    const gainNode = this.#audioCtx.createGain();
    gainNode.connect(this.#audioCtx.destination);

    const oscillatorNode = this.#audioCtx.createOscillator();
    oscillatorNode.type = "sine";
    oscillatorNode.connect(gainNode);

    return { oscillatorNode, gainNode };
  }
}
