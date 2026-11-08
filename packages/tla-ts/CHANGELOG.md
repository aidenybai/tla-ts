# tla-ts

## 0.0.9

### Patch Changes

- Check a spec whose union mixes tuples and strings, as TLC does. It used to fail to fingerprint the set (#362, #378).
- Parse a recursive operator that passes an operator parameter to itself (#363, #378).
- Lint a constant definition with many records in linear time instead of quadratic time (#361, #378).
- Warn when a parallel check falls back to one worker because the search created a string. The CLI names the string on stderr, and `onProgress` gets a `sequential-fallback` event (#360, #378).
- Support `-continue`. `tla-ts Spec.tla -continue` prints each invariant and action property violation and keeps exploring, like TLC, instead of rejecting the flag. `check()` takes `isContinued` and reports each violation to `onProgress` as a `violation` event. A continued check runs on one worker (#358).
- Compile specs faster and evaluate them as TLC does. One pass over the definitions computes their levels, effects and read variables, and the evaluator's value caches are gone, so operators and lazy functions evaluate again at each use. State checking is 5 to 15% slower without the fingerprinter's value cache, and a check no longer shares TLC's own modules with earlier checks in the process (#357).
- Read TLA+ source faster. The lexer classifies characters by code through one table instead of testing them with regular expressions, and tries only the operators that start with the current character (#355).

## 0.0.8

### Patch Changes

- Start checking small specs faster. TLC's orders reuse the parse of the root module, the contexts of TLC's own modules are built once per process, and SANY's context tables hash each name once (#353).
- Let Bun collect garbage during parallel model checking. Each worker now takes a short break about every 100 ms of a level, so ten workers on a large model no longer use more memory than the machine has (#352).
- Check specs in hosts that disallow code generation from strings, such as Cloudflare Workers or a page whose CSP lacks `'unsafe-eval'`. `check()` used to throw an `EvalError` there. It now evaluates with the interpreter instead of generated code (#351).
- Check specs with less CPU time. The checker reads and parses a spec's modules once instead of once for each order TLC uses, and parses TLC's own modules once per process (#350).

## 0.0.7

### Patch Changes

- Check actions faster when other guards come before their label guard, as in `turn = self /\ pc[self] = "a"` (#342).
- Fingerprint stored states faster by keeping the fingerprints of shared values from one level to the next (#341).
- Check `UNCHANGED` faster on specs with many variables. It copies the state once instead of once for each variable it names (#340).

## 0.0.6

### Patch Changes

- Fix `prove` never returning under Node on `\A n \in Nat : n + n = 3 * n BY SMT`. Factoring a polynomial with a large discriminant no longer loops, so the SMT solver answers unknown at its time limit (#334). Fix `prove` under Bun, which spent most of its time reading heap statistics. A module that took 45.4 s and failed a proof now proves in 241 ms (#335).

## 0.0.5

### Patch Changes

- Prove TLAPS proofs without tlapm. `prove` checks each proof obligation of a module with TypeScript ports of tlapm's backends: Zenon, Isabelle, the SMT solver, and the PTL prover. `tla-ts tlapm Module.tla` takes tlapm's options, prints what tlapm prints, and reads and writes tlapm's fingerprints and `.tlacache`. It replaces `tla-ts prove`. Model checking has 16 performance changes, in evaluation, fingerprinting, and liveness checking.

## 0.0.4

### Patch Changes

- Run in place of `java` for tools that launch TLC, such as pstack's statechart skill. `tla-ts -cp tla2tools.jar tlc2.TLC -tool Spec.tla` prints TLC's `-tool` output, `tla2sany.xml.XMLExporter` writes SANY's XML, and `-Dtla-ts.tlc=1.7.4` reproduces TLC 1.7.4 without its jar. Add `-dump`, which writes the state graph as TLC does. Print SANY's parse errors, and match TLC and SANY in more cases, including a spec's own Bags, Json, Randomization, or TLCExt module.

## 0.0.3

### Patch Changes

- Add `tla-ts prove`, which prints proof obligations as `tlapm -N` does and runs tlapm otherwise. The CLI now checks several specs or a glob in one run. Parallel checking keeps tuple domains shared when states move between workers.

## 0.0.2

### Patch Changes

- Add tsprover, which compiles TypeScript models to TLA+ and checks them with tla-ts. tla-ts and tsprover now release together at the same version.

## 0.0.1

### Patch Changes

- init
