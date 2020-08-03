import "regenerator-runtime/runtime";
import Controller from "./Controller";
import "./styles.css";

(async () => {
  const theremin = new Controller(document.querySelector("#app"));
  try {
    await theremin.setup();
  } catch (e) {
    throw new Error(`Could not run setup: ${e.message}`);
  }
  theremin.start();
})();
