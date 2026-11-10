/*---
description: Ported from TypeScript's tests/cases/conformance/es6/Symbols/symbolProperty20.ts.
outcome: success
source: tests/cases/conformance/es6/Symbols/symbolProperty20.ts
---*/
//@target: ES6
interface I {
    [Symbol.iterator]: (s: string) => string;
    [Symbol.toStringTag](s: number): number;
}

var i: I = {
    [Symbol.iterator]: s => s,
    [Symbol.toStringTag](n) { return n; }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
