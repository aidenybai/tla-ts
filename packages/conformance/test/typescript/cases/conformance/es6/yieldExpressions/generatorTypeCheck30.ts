/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck30.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck30.ts
---*/
//@target: ES6
function* g2(): Iterator<Iterable<(x: string) => number>> {
    yield function* () {
        yield x => x.length;
    } ()
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
