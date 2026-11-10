/*---
description: Ported from TypeScript's tests/cases/compiler/typePredicatesInUnion_noMatch.ts.
outcome: success
source: tests/cases/compiler/typePredicatesInUnion_noMatch.ts
---*/
// @target: es2015
interface A {
    pred(x: {}, y: {}): x is boolean;
}
interface B {
    pred(x: {}, y: {}): y is string;
}

type Or = A | B;

function f(o: Or, x: {}, y: {}) {
    if (o.pred(x, y)) {
        x;
        y;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
