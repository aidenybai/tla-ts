import { readNumbers } from "./patterns";

const read = readNumbers("12x3")
  .map((found) => `${found.text}@${found.index}`)
  .join(";");
if (read !== "12@0;3@3") throw new Error(read);
