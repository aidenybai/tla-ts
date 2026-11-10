/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/typeGuards/typePredicateASI.ts.
outcome: success
source: tests/cases/conformance/expressions/typeGuards/typePredicateASI.ts
---*/
// @target: es2015
interface I {
    foo(callback: (a: any, b: any) => void): I
    is(): boolean;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
