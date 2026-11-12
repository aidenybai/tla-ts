// Unlike an import from "node:fs", this skips building its ESM namespace, which loads fs/promises, readline and the fs streams.
export const fileSystem = process.getBuiltinModule("node:fs");
