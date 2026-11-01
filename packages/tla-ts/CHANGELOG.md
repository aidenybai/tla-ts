# tla-ts

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
