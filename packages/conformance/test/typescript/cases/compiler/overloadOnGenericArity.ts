/*---
description: Ported from TypeScript's tests/cases/compiler/overloadOnGenericArity.ts.
outcome: success
source: tests/cases/compiler/overloadOnGenericArity.ts
---*/
// @target: es2015
interface Test {
    then<U>(p: string): string;
    then(p: string): Date; // Error: Overloads cannot differ only by return type
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
