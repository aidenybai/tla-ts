import { legacy, name, viaImport } from "./bridge.mjs";

const seen = [name, legacy.viaRequire, viaImport].join();
if (seen !== "legacy,require,import") throw new Error("seen " + seen);
