/*---
description: Ported from TypeScript's tests/cases/compiler/conditionalTypeGenericInSignatureTypeParameterConstraint.ts.
outcome: success
source: tests/cases/compiler/conditionalTypeGenericInSignatureTypeParameterConstraint.ts
---*/
// @target: es2015
// should be x
type H_inline1<x> = (<o extends x>() => o) extends (() => infer o) ? o : never;

type Result = H_inline1<string>; // should be `string`

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
