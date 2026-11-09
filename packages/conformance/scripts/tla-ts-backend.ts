import { readFileSync } from "node:fs";
import { decideIsabelle } from "../../tla-ts/src/prover/isabelle/decide";
import { decidePtl } from "../../tla-ts/src/prover/ptl/decide";
import { runSmtlibScript } from "../../tla-ts/src/prover/smt/solver/smtlib-script";
import { decideSmt } from "../../tla-ts/src/prover/smt/solver/solver";
import { decideZenon } from "../../tla-ts/src/prover/zenon/decide";
import { getBackendVerdict, isSmtScript } from "./tlapm";

const TIME_LIMITS: Record<string, number> = { z3: 5, zenon: 10, isabelle: 30, ls4: 10 };

const backend = process.argv[2];
const text = readFileSync(process.argv[3], "utf8");
const options = { timeLimitMs: TIME_LIMITS[backend] * 1000 };

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
    decision.verdict === "unsat" ? getBackendVerdict("zenon", decision.proof, 0) : decision.verdict,
  );
} else if (backend === "z3") {
  console.log(decideSmt(text, options, () => {}));
} else {
  const decide = { isabelle: decideIsabelle, ls4: decidePtl }[backend];
  if (!decide) {
    console.error(`Unknown backend ${backend}`);
    process.exit(1);
  }
  console.log(decide(text, options));
}
