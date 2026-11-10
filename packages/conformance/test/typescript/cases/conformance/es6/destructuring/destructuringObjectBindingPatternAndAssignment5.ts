/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/destructuringObjectBindingPatternAndAssignment5.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/destructuringObjectBindingPatternAndAssignment5.ts
---*/
// @target: es2015
function a () {
    let x: number;
    let y: any
    ({ x, ...y } = ({ } as any));
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
