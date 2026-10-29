import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";

export const getTlapmPaths = () =>
  (process.env.PATH ?? "")
    .split(delimiter)
    .map((directory) => join(directory, "tlapm"))
    .filter((path) => existsSync(path));
