/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloadsOnGenericArity1.ts.
outcome: success
source: tests/cases/compiler/functionOverloadsOnGenericArity1.ts
---*/
// @target: es2015
// overloading on arity not allowed
interface C {
   f<T>(): string;
   f<T, U>(): string; 
 
   <T>(): string;
   <T, U>(): string; 
 
  new <T>(): string;
  new <T, U>(): string; 
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
