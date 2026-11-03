# tla-ts

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
