/*---
description: Ported from TypeScript's tests/cases/compiler/newLineInTypeofInstantiation.ts.
outcome: success
source: tests/cases/compiler/newLineInTypeofInstantiation.ts
---*/
// @target: es2015
interface Example {
    (a: number): typeof a
  
    <T>(): void
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
