import mode from "./mode.cjs";

const seen = [mode.name, mode.processType].join();
if (seen !== "development,object") throw new Error("seen " + seen);
