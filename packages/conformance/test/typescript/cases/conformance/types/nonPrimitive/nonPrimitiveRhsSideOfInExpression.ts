/*---
description: Ported from TypeScript's tests/cases/conformance/types/nonPrimitive/nonPrimitiveRhsSideOfInExpression.ts.
outcome: success
source: tests/cases/conformance/types/nonPrimitive/nonPrimitiveRhsSideOfInExpression.ts
---*/
// @target: es2015
let o: object = {};

function f(): object {
	return {};
}

const b1 = "foo" in o;
const b2 = "bar" in f();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
