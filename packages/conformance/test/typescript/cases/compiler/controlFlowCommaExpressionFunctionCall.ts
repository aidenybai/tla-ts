/*---
description: Ported from TypeScript's tests/cases/compiler/controlFlowCommaExpressionFunctionCall.ts.
outcome: success
source: tests/cases/compiler/controlFlowCommaExpressionFunctionCall.ts
---*/
// @target: es2015
const otherValue = () => true;
const value : number | string = null as any;

function isNumber(obj: any): obj is number {
    return true; // method implementation irrelevant
}

// Bad case - fails
if (isNumber((otherValue(), value))) {
    const b = value; // string | number , but should be number
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
