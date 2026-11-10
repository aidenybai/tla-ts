/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloadsOnGenericArity2.ts.
outcome: success
source: tests/cases/compiler/functionOverloadsOnGenericArity2.ts
---*/
// @target: es2015
interface I {
    then(p: string): string;
    then<U>(p: string): string;
    then<U, T>(p: string): Date;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
