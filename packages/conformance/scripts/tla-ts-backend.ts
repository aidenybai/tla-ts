import { readFileSync } from "node:fs";
import { decideIsabelle } from "../../tla-ts/src/prover/isabelle/decide";
import { decidePtl } from "../../tla-ts/src/prover/ptl/decide";
import { runSmtlibScript } from "../../tla-ts/src/prover/smt/solver/smtlib-script";
import { decideSmt } from "../../tla-ts/src/prover/smt/solver/solver";
import { decideZenon } from "../../tla-ts/src/prover/zenon/decide";
import { getBackendVerdict, isSmtScript } from "./tlapm";

const backend = process.argv[2];
const text = readFileSync(process.argv[3], "utf8");
// The oracle runs each backend with no time limit of its own.
const options = { timeLimitMs: Infinity };

// The oracle records Z3's stdout followed by its stderr.
if (isSmtScript(process.argv[3])) {
  const diagnostics: string[] = [];
  runSmtlibScript(text, options, (line, isDiagnostic) =>
    isDiagnostic ? diagnostics.push(line) : console.log(line),
  );
  for (const line of diagnostics) console.log(line);
} else if (backend === "zenon") {
  const decision = decideZenon(text, options);
  console.log(
    decision.output === undefined
      ? decision.verdict
      : getBackendVerdict("zenon", decision.output, 0),
  );
} else if (backend === "z3") {
  console.log(decideSmt(text, options, () => {}));
} else if (backend === "isabelle") {
  console.log(decideIsabelle(text, options));
} else if (backend === "ls4") {
  console.log(decidePtl(text, options));
} else {
  console.error(`Unknown backend ${backend}`);
  process.exit(1);
}
