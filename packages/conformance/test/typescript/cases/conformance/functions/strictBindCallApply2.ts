/*---
description: Ported from TypeScript's tests/cases/conformance/functions/strictBindCallApply2.ts.
outcome: success
source: tests/cases/conformance/functions/strictBindCallApply2.ts
---*/
// @target: es2015
// @strictFunctionTypes: false
// @strictBindCallApply: true

// Repro from #32964

interface Foo { blub: string };
function fn(this: Foo) {}

type Test = ThisParameterType<typeof fn>; 

const fb = fn.bind({ blub: "blub" });

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
