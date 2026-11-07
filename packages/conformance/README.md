# Conformance suite

This suite pins down what the TLA+ tools do, one behavior per file, the way test262 pins down ECMAScript. It has two halves, each with its own oracle:

- `test/tlc`: [TLC](https://github.com/tlaplus/tlaplus), the model checker. The oracle is TLC 1.8.0. Any tool that speaks TLC's `-tool` protocol can run these tests.
- `test/tlapm`: [tlapm](https://github.com/tlaplus/tlapm), the proof manager, and the four backends it calls: Z3, Zenon, Isabelle and LS4. The oracle is tlapm at revision `b91fb6c`, with Z3 5.3.2. Any tool that speaks tlapm's toolbox protocol can run these tests.

tla-ts is one host among others.

The suite complements `packages/tla-ts/tests/conformance`. That corpus compares status and state counts on real specs, and proof results on real modules. This suite compares exact output on small tests.

[What the suite covers](COVERAGE.md) lists how much of TLC the suite reaches, what it leaves out and why, and the TLC bugs it pins.

## Run the suite

You need Bun and Node. You need Java and tlapm only to run the oracles themselves, because each test stores its oracle's recording.

```sh
pnpm --filter tla-ts build
pnpm --filter @tla-ts/conformance conformance
pnpm --filter @tla-ts/conformance conformance tlc/expressions/except
pnpm --filter @tla-ts/conformance conformance --verbose tlapm/backends/zenon
```

Each argument that isn't an option filters tests by path. The run prints a score per directory and writes every result to `.results/<host>.json`.

## Choose a host

`--host` takes one of these, or a whole command:

| Host     | Runs                                                             |
| -------- | ---------------------------------------------------------------- |
| `tla-ts` | Both halves, with `packages/tla-ts/dist/cli.js`. The default.    |
| `tlc`    | The TLC oracle, on `test/tlc`. Run `pnpm fetch-tlc` first.       |
| `tlapm`  | The tlapm oracle, on `test/tlapm`. Run `pnpm fetch-tlapm` first. |

```sh
pnpm conformance --host tlc
pnpm conformance --host "./my-checker --flag" tlc
```

`pnpm fetch-tlc` builds TLC at the suite's revision from source, since tlaplus publishes TLC only as a rolling release. It needs git, a JDK and Ant.

A command host runs every test the filters select. It gets TLC's flags for a TLC test and tlapm's flags for a tlapm test. For a backend test, it gets the backend's name and the input file, and must print the verdict, as described below.

`pnpm fetch-tlapm` needs Z3 5.3.2 on `PATH` as `z3`. tlapm's release bundles an x86_64 Z3 4.8.9, so the script links tlapm to the system Z3.

`--shard 2/8` runs every eighth test, starting with the third. CI uses it to split the suite into parallel jobs.

For TLC, the runner adds `-tool -workers 1 -fp 0 -seed 4 -lncheck final -noGenerateSpecTE`, so a run is deterministic. For tlapm, it adds `--strict --toolbox 0 0 --threads 1` and a fresh `--cache-dir`. Set `CONFORMANCE_WORKERS` to change how many tests run at once. The default is at most 4.

`--time-limit <seconds>` and `--memory-limit <MB>` stop a host that runs too long or uses too much memory. The memory is the resident memory of the host and every process it starts. The runner kills them all, and the test gets the verdict `time-limit` or `memory-limit`.

## Read a test

A test is one file with metadata at the top and its oracle's recording at the end. A `.tla` test keeps both outside the module, where SANY and tlapm ignore them. The runner removes the recording before it gives the file to a host.

```tla
(*---
description: Len of a non-sequence is an evaluation error.
ref: tlc2/module/Sequences.java#Len
features: [Sequences]
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE len_of_integer ----
EXTENDS Sequences
Test == Len(3) = 3
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    3
---*)
```

The metadata has these fields:

| Field         | Meaning                                                              |
| ------------- | -------------------------------------------------------------------- |
| `description` | The one behavior the test pins down. Required.                       |
| `outcome`     | What the author says the oracle does. Required.                      |
| `mode`        | How a tlapm test runs tlapm, described below.                        |
| `ref`         | The source or documentation section behind the behavior.             |
| `source`      | The upstream file that a ported test came from.                      |
| `features`    | Tags for filtering and reporting.                                    |
| `flags`       | `expression` or `exit-only`, described below.                        |
| `contexts`    | The contexts to run an `expression` test in. All of them by default. |
| `config`      | The text of the `.cfg` file. Empty by default.                       |
| `args`        | Extra TLC or tlapm flags.                                            |
| `includes`    | Fixture files beside the test, which the runner copies with it.      |

A file without metadata is a fixture and doesn't run on its own.

## Declare an outcome

The `outcome` states your intent. `pnpm record` refuses to write a recording if the oracle contradicts it, so a mistaken test can't become the expected behavior.

A TLC test declares TLC's exit status:

| Outcome                 | TLC exit status           |
| ----------------------- | ------------------------- |
| `success`               | 0                         |
| `usage-error`           | 1                         |
| `assumption-violation`  | 10                        |
| `deadlock`              | 11                        |
| `safety-violation`      | 12                        |
| `liveness-violation`    | 13                        |
| `assertion-failure`     | 14                        |
| `evaluation-failure`    | 10, 75, 76, 77, or 255    |
| `parse-error`           | 150                       |
| `config-error`          | 151                       |
| `state-space-too-large` | 152                       |
| `system-error`          | 153                       |
| `tlc-error`             | 255                       |
| `any`                   | Any of the above except 1 |

Only generated and some imported tests use `any`. Those tests ask that a host match the oracle, whatever the oracle does.

A tlapm test declares tlapm's exit status under `--strict`:

| Outcome        | tlapm exit status | Meaning                                               |
| -------------- | ----------------- | ----------------------------------------------------- |
| `proved`       | 0                 | Every obligation is proved, or `-N` found no problem. |
| `failed`       | 10                | A backend failed to prove an obligation.              |
| `incomplete`   | 11                | A proof step is missing or omitted.                   |
| `empty-target` | 12                | `--line` or `--toolbox` selects no obligation.        |
| `rejected`     | 3                 | tlapm ends abnormally, such as on a parse error.      |

A backend test declares the backend's verdict: `unsat`, `sat` or `unknown`. `unsat` means the backend proved the goal.

## Run a proof

A tlapm test's `mode` decides how far tlapm goes:

- `obligations` runs `-N --printallobs`. It records the obligations tlapm generates, with their normalized text, and any error. No backend runs.
- `proof` runs the backends. It records each obligation's final status, the backend that closed it, and why it failed.
- `encoding` runs the backends with `--debug tempfiles`. It also records the input tlapm wrote for each backend.

A backend test is a backend's input, such as `test/tlapm/backends/z3/<name>.smt`, with the metadata on top. The oracle runs the backend from tlapm's release with tlapm's own command line. The recording is the verdict, followed by the proof for Zenon. An Isabelle theory's name must equal its file name.

A `.smt2` test is one of [z3test](https://github.com/Z3Prover/z3test)'s regressions, a whole SMT-LIB script. The oracle runs it the way z3test does, with `z3 model_validate=true`, and the recording is everything Z3 prints. A host gets `z3` and the file, and must print what Z3 prints.

A proof result must not depend on time. A test that proves must prove far below its time limit, and a test that fails must fail because the backend gives up or refutes the goal, never because it runs out of time.

## Run an expression in every context

test262 runs a test in strict and sloppy mode. This suite runs an `expression` test in five contexts, because TLC evaluates along a different path in each:

- `assume`: `ASSUME Test`
- `init`: the initial state assigns `Test` to a variable
- `next`: the next-state action assigns `Test` to a variable
- `invariant`: `Test` is part of an invariant
- `property`: `Test` is part of a temporal property

The test defines `Test` and the runner appends the rest inside the module. Your line numbers don't change.

The same error exits differently by context. `Len(3)` exits 10 in `assume`, 75 in `init`, and 255 in `next`.

## Compare results

The runner compares a host's output with the recording after it removes what differs between runs, such as dates, durations, paths, progress messages and the names of temporary files. Each result gets one verdict. The messages are TLC's message codes, each obligation's status and prover for tlapm, and the verdict for a backend.

| Verdict            | Meaning                                           |
| ------------------ | ------------------------------------------------- |
| `pass`             | The exit status and the transcript match.         |
| `text-mismatch`    | The messages match, but some text differs.        |
| `message-mismatch` | The exit status matches, but the messages differ. |
| `exit-mismatch`    | The exit status differs.                          |
| `time-limit`       | The host ran past `--time-limit`.                 |
| `memory-limit`     | The host used more than `--memory-limit`.         |
| `crash`            | A signal killed the host.                         |
| `unrecorded`       | The test has no recording yet.                    |

`exit-only` tests compare only the exit status and run without `-tool`. Use this flag when a test calls `TLCExt!AssertError`. That operator compares against the message text, and `-tool` wraps that text, so true assertions become false.

## Track known failures

`baselines/<host>.json` lists each test a host fails and its verdict. A run exits 1 if a result differs from the baseline in either direction, so a regression and an unrecorded fix both fail. Update the file with `--update-baseline`.

A baseline entry says what fails, not what is right. When an oracle has a bug, keep the correct behavior in the host and leave the test in the baseline. Tests that pin a bug have `features: [tlc-bug]` or `features: [tlapm-bug]`.

## Add a test

1. Read the oracle's source for the behavior, and write the file under `test/tlc/<area>/` or `test/tlapm/<area>/`. Module names can't contain hyphens, so name the file in `snake_case`.
2. Run `pnpm fetch-tlc` or `pnpm fetch-tlapm` once, then `pnpm record <path>`. Add `--missing` to skip tests that already have a recording.
3. Read the recording. It must show the behavior your description claims.
4. Run `pnpm conformance --host tlc <path>` or `--host tlapm` to confirm that the recording is deterministic.
5. Run `pnpm conformance <path>`, then fix the host or update its baseline.

## Layout

| Path                                   | Contents                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/tlc/imported`                    | Tests ported from TLC and SANY by `scripts/import-tlc.ts`.                                                                                                    |
| `test/tlc/generated`                   | Matrices written by `scripts/generate*.ts`. Don't edit these by hand. Regenerating keeps the recording of every test whose metadata and module are unchanged. |
| `test/tlapm/imported`                  | Tests ported from tlapm's own test tree, and from the Zenon and Isabelle trees in tlapm's checkout, by `scripts/import-tlapm.ts`.                             |
| `test/tlapm/backends`                  | Backend tests, one directory per backend. `z3/z3test` holds z3test's regressions, ported by `scripts/import-z3test.ts`.                                       |
| `test/tlc/<area>`, `test/tlapm/<area>` | Tests written by hand.                                                                                                                                        |
| `baselines`                            | Known failures per host.                                                                                                                                      |
| `scripts`                              | The runner, recorder, importers and generators. `scripts/run.ts` bundles each with Bun and runs it with Node.                                                 |
