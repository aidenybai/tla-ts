import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { TlaTypeScriptError } from "../../tla-ts/src/errors";
import { check } from "../../tla-ts/src/parallel";
import { compile } from "../../tla-ts/src/typescript/compile";
import { UNTRANSLATABLE_EXIT } from "./test-file";

// Where TLC stops because a value has no TLA+ form, or tla-ts stops because it can't follow the
// program, rather than because the program throws.
const UNREPRESENTABLE = [
  "Overflow when computing",
  "TLC can't handle a number this big",
  "TLA+ sequences can't have holes",
  "tla-ts can't",
];

const file = process.argv[2];

const stop = (reason: string) => {
  console.log(`untranslatable: ${reason.split("\n")[0].replaceAll(`${dirname(file)}/`, "")}`);
  process.exit(UNTRANSLATABLE_EXIT);
};

const result = await Promise.resolve()
  .then(() => check({ ...compile(readFileSync(file, "utf8"), file), onPrint: () => {} }))
  .catch((error: unknown) => {
    // tla-ts compiles each statement inside the one before it, so thousands of statements run out of
    // stack.
    if (error instanceof RangeError && error.message.includes("Maximum call stack size exceeded")) {
      return stop("too many statements to compile");
    }
    if (error instanceof TlaTypeScriptError) return stop(error.message);
    throw error;
  });
if (result.status === "success" || result.status === "deadlock") {
  console.log("success");
  process.exit(0);
}
const message = result.failure?.message ?? result.status;
if (UNREPRESENTABLE.some((text) => message.includes(text))) stop(message);
console.log("throws");
process.exit(1);
