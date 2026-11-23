/// <reference types="node" />
import type { Stats } from "node:fs";

const sizes: (Stats["size"] | ReturnType<typeof import("node:path").join>)[] = [1, "two"];
const seen = sizes.join();
if (seen !== "1,two") throw new Error("seen " + seen);
