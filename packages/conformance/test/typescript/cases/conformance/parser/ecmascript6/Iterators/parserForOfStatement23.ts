/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript6/Iterators/parserForOfStatement23.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript6/Iterators/parserForOfStatement23.ts
---*/
// @target: esnext

async function foo(x: any) {
    var async;
    for await (async of x) {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
