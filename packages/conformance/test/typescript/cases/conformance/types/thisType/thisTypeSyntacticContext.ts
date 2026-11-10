/*---
description: Ported from TypeScript's tests/cases/conformance/types/thisType/thisTypeSyntacticContext.ts.
outcome: success
source: tests/cases/conformance/types/thisType/thisTypeSyntacticContext.ts
---*/
// @target: es2015
function f(this: { n: number }) {
}

const o: { n: number, test?: (this: { n: number }) => void } = { n: 1 }
o.test = f

o.test();
o!.test();
o.test!();
o.test!!!();
(o.test!)();
(o.test)();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
