/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck28.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck28.ts
---*/
//@target: ES6
function* g(): IterableIterator<(x: string) => number> {
    yield * {
        *[Symbol.iterator]() {
            yield x => x.length;
        }
    };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
