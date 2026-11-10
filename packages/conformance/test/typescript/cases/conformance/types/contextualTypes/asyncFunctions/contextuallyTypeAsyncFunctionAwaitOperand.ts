/*---
description: Ported from TypeScript's tests/cases/conformance/types/contextualTypes/asyncFunctions/contextuallyTypeAsyncFunctionAwaitOperand.ts.
outcome: success
source: tests/cases/conformance/types/contextualTypes/asyncFunctions/contextuallyTypeAsyncFunctionAwaitOperand.ts
---*/
// @target: esnext
// @noImplicitAny: true
// @noEmit: true

interface Obj { key: "value"; }

async function fn1(): Promise<Obj> {
    const obj1: Obj = await { key: "value" };
    const obj2: Obj = await new Promise(resolve => resolve({ key: "value" }));
    return await { key: "value" };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
