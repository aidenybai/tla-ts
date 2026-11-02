import arithmetic from "./examples/Arithmetic.tla?raw";
import counter from "./examples/Counter.tla?raw";
import dieHard from "./examples/DieHard.tla?raw";
import invariant from "./examples/Invariant.tla?raw";
import locks from "./examples/Locks.tla?raw";
import mistake from "./examples/Mistake.tla?raw";
import sets from "./examples/Sets.tla?raw";
import trafficLight from "./examples/TrafficLight.tla?raw";
import type { RunRequest } from "./run-worker";

export interface Example {
  name: string;
  description: string;
  source: string;
  run: RunRequest;
  cli: string;
  api: string;
}

// The status in each API example is what check returns for the spec, and matches TLC.
const getSpecExample = (
  name: string,
  source: string,
  config: string,
  status: string,
  description: string,
): Example => ({
  name,
  description,
  source: source.trim(),
  run: { kind: "check", source, config },
  cli: `npx tla-ts ${name}.tla`,
  api: `import { check } from "tla-ts";

const result = await check({
  source,
  config: "${config}",
});
result.status; // "${status}"`,
});

// The statuses in each API example are what prove returns for the module, and match tlapm.
const getProofExample = (
  name: string,
  source: string,
  statuses: string[],
  description: string,
): Example => ({
  name,
  description,
  source: source.trim(),
  run: { kind: "prove", source },
  cli: `npx tla-ts tlapm ${name}.tla`,
  api: `import { prove } from "tla-ts";

const result = await prove({ source });
result.obligations.map((obligation) => obligation.status);
// ${JSON.stringify(statuses).replaceAll(",", ", ")}`,
});

export const SPEC_EXAMPLES = [
  getSpecExample(
    "Counter",
    counter,
    "INIT Init NEXT Next INVARIANT Small",
    "invariant-violation",
    "Find the steps where count reaches 3 and breaks Small.",
  ),
  getSpecExample(
    "DieHard",
    dieHard,
    "INIT Init NEXT Next INVARIANT NotSolved",
    "invariant-violation",
    "Find how to measure exactly 4 gallons with a 3 and a 5 gallon jug, the puzzle from Die Hard 3.",
  ),
  getSpecExample(
    "Locks",
    locks,
    "INIT Init NEXT Next",
    "deadlock",
    "Find the deadlock when each process holds one lock and waits for the other.",
  ),
  getSpecExample(
    "TrafficLight",
    trafficLight,
    "SPECIFICATION Spec PROPERTY EventuallyGreen",
    "liveness-violation",
    "Find why the light may never turn green: nothing forces it to leave red.",
  ),
];

export const PROOF_EXAMPLES = [
  getProofExample(
    "Arithmetic",
    arithmetic,
    ["proved", "trivial"],
    "Prove that n + n = 2 * n for every natural number.",
  ),
  getProofExample(
    "Sets",
    sets,
    ["proved", "trivial"],
    "Prove that set intersection is commutative, with the Zenon prover.",
  ),
  getProofExample(
    "Invariant",
    invariant,
    ["proved", "trivial", "trivial", "trivial", "proved", "proved"],
    "Prove that count is always a natural number, by induction over the steps of Spec.",
  ),
  getProofExample(
    "Mistake",
    mistake,
    ["failed", "trivial"],
    "See a proof fail: the theorem is false for n = 0 and n = 1.",
  ),
];
