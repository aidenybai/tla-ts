/*---
description: Ported from TypeScript's tests/cases/compiler/destructuringPropertyAssignmentNameIsNotAssignmentTarget.ts.
outcome: success
source: tests/cases/compiler/destructuringPropertyAssignmentNameIsNotAssignmentTarget.ts
---*/
// @target: es2015
// test for #10668
function qux(bar: { value: number }) {
    let foo: number;
    ({ value: foo } = bar);
    let x = () => bar;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
