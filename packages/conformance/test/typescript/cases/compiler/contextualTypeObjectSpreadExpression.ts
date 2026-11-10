/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTypeObjectSpreadExpression.ts.
outcome: success
source: tests/cases/compiler/contextualTypeObjectSpreadExpression.ts
---*/
// @target: es2015
interface I {
    a: "a";
}
let i: I;
i = { ...{ a: "a" } };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
