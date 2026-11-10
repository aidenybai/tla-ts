/*---
description: Ported from TypeScript's tests/cases/compiler/parseArrowFunctionWithFunctionReturnType.ts.
outcome: success
source: tests/cases/compiler/parseArrowFunctionWithFunctionReturnType.ts
---*/
// @target: es2015
const fn = <T>(): (() => T) => null as any;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
