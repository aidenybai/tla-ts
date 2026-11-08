// tla-ts's host for backend tests: runs its port of a tlapm backend on one input and prints the
// verdict the way getBackendVerdict reduces the real backend's output.
// Usage: node .scripts/tla-ts-backend.js <z3|zenon|isabelle|ls4> <file>

import { readFileSync } from "node:fs";
import { decideIsabelle } from "../../tla-ts/src/prover/isabelle/decide";
import { decidePtl } from "../../tla-ts/src/prover/ptl/decide";
import { runSmtlibScript } from "../../tla-ts/src/prover/smt/solver/smtlib-script";
import { decideSmt } from "../../tla-ts/src/prover/smt/solver/solver";
import { decideZenon } from "../../tla-ts/src/prover/zenon/decide";
import { getBackendVerdict, isSmtScript } from "./tlapm";

// tlapm's default time limits in seconds (src/method.ml).
const TIME_LIMITS: Record<string, number> = { z3: 5, zenon: 10, isabelle: 30, ls4: 10 };

const backend = process.argv[2];
const text = readFileSync(process.argv[3], "utf8");
const options = { timeLimitMs: TIME_LIMITS[backend] * 1000 };

if (isSmtScript(process.argv[3])) {
  runSmtlibScript(text, options, (line) => console.log(line));
} else if (backend === "zenon") {
  const decision = decideZenon(text, options);
  console.log(
    decision.verdict === "unsat" ? getBackendVerdict("zenon", decision.proof, 0) : decision.verdict,
  );
} else {
  const decide = { z3: decideSmt, isabelle: decideIsabelle, ls4: decidePtl }[backend];
  if (!decide) {
    console.error(`Unknown backend ${backend}`);
    process.exit(1);
  }
  console.log(decide(text, options));
}
