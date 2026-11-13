import type { Level } from "./levels";

const level: Level = { value: 2 };
if (level.value !== 2) throw new Error("leveled");
