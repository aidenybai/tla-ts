/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck64.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck64.ts
---*/
// @strict: true
// @target: esnext
// @noEmit: true

function* g3(): Generator<Generator<(x: string) => number>> {
    yield function* () {
        yield x => x.length;
    } ()
}

function* g4(): Iterator<Iterable<(x: string) => number>> {
  yield (function* () {
    yield (x) => x.length;
  })();
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
