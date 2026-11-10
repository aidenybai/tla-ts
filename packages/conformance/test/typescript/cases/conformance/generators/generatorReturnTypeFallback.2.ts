/*---
description: Ported from TypeScript's tests/cases/conformance/generators/generatorReturnTypeFallback.2.ts.
outcome: success
source: tests/cases/conformance/generators/generatorReturnTypeFallback.2.ts
---*/
// @target: esnext
// @lib: es5
// @noemit: true
// @strict: true

// Allow generators to fallback to IterableIterator if they do not need a type for the sent value while in strictNullChecks mode.
// Report an error if IterableIterator cannot be found.
function* f() {
    yield 1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
