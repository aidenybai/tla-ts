import required from "./requires-esm.cjs";

const seen = [required.kind].join();
if (seen !== "esm") throw new Error("seen " + seen);
