/*---
description: Ported from TypeScript's tests/cases/conformance/generators/generatorReturnTypeFallback.3.ts.
outcome: success
source: tests/cases/conformance/generators/generatorReturnTypeFallback.3.ts
---*/
// @target: esnext
// @lib: es5,es2015.iterable
// @noemit: true
// @strict: true

function* f() {
    const x: string = yield 1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
