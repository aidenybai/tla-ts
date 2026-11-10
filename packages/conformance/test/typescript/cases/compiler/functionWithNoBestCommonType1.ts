/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithNoBestCommonType1.ts.
outcome: success
source: tests/cases/compiler/functionWithNoBestCommonType1.ts
---*/
// @target: es2015
// @allowUnreachableCode: true

function foo() {
    return true;
    return bar();
}

function bar(): void {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
