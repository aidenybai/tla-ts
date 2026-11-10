/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Iterators/parserForOfStatement24.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Iterators/parserForOfStatement24.ts
---*/
// @target: esnext

var async;
for ((async) of [1, 2]);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
