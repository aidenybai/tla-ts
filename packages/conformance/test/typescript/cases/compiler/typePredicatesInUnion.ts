/*---
description: Ported from TypeScript's tests/cases/compiler/typePredicatesInUnion.ts.
outcome: success
source: tests/cases/compiler/typePredicatesInUnion.ts
---*/
// @target: es2015
interface A {
    pred(x: {}): x is boolean;
}
interface B {
    pred(x: {}): x is string;
}

type Or = A | B;

function f(o: Or, x: {}) {
    if (o.pred(x)) {
        x;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
