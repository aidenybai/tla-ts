/*---
description: Ported from TypeScript's tests/cases/conformance/salsa/propertyAssignmentUseParentType3.ts.
outcome: success
source: tests/cases/conformance/salsa/propertyAssignmentUseParentType3.ts
---*/
// @target: es2015
// @strict: false
// don't use the parent type if it's a function declaration (#33741)

function foo1(): number {
    return 123;
}
foo1.toFixed = "";

function foo2(): any[] {
    return [];
}
foo2.join = "";

function foo3(): string {
    return "";
}
foo3.trim = "";

function foo4(): ({x: number}) {
    return {x: 123};
}
foo4.x = "456";

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
