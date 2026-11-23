import type { Level } from "./levels.ts";

const level: Level = { value: 2 };
if (level.value !== 2) throw new Error("leveled");
