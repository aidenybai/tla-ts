/*---
description: Ported from TypeScript's tests/cases/compiler/intersectionTypeWithLeadingOperator.ts.
outcome: success
source: tests/cases/compiler/intersectionTypeWithLeadingOperator.ts
---*/
// @target: es2015
type A = & string;
type B =
  & { foo: string }
  & { bar: number };

type C = [& { foo: 1 } & { bar: 2 }, & { foo: 3 } & { bar: 4 }];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
