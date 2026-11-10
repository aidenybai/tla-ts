/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck26.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck26.ts
---*/
//@target: ES6
function* g(): IterableIterator<(x: string) => number, (x: string) => number> {
    yield x => x.length;
    yield *[x => x.length];
    return x => x.length;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
